"""
mertsightsAI - RAG-powered conversational analytics for TMS data
Converts natural language questions into SQL queries and returns insights as tables/charts
"""

import google.generativeai as genai
from config.settings import GEMINI_API_KEY, GEMINI_MODEL
import json
import re
from datetime import datetime
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import io
import base64
import numpy as np

class MertsightsAI:
    def __init__(self, db_client):
        """Initialize with database client and Gemini API"""
        self.db_client = db_client
        
        # Validate API key
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your-gemini-api-key":
            raise ValueError("GEMINI_API_KEY environment variable not configured")
        
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Database schema for context
        self.schema = self._get_schema_context()
    
    def _get_schema_context(self):
        """Provide database schema to LLM for accurate SQL generation"""
        return """
DATABASE SCHEMA:

-- ORDERS TABLE (customer shipment requests)
orders: id, order_number, customer, origin, destination, weight_lbs, volume_cuft, 
        priority, status, delivery_window_start, delivery_window_end, special_requirements,
        order_received_date, must_arrive_by_date, planned_to_load_date, assigned_load_number,
        origin_facility_id, destination_facility_id, created_at, updated_at

-- LOADS TABLE (optimized truck loads)
loads: id, load_number, truck_type, total_weight_lbs, total_volume_cuft, utilization_percent,
       origin, status, load_created_date, must_arrive_by_date, must_pick_up_by_date,
       assigned_carrier, origin_facility_id, created_at, updated_at

-- LOAD_ORDERS TABLE (junction for many-to-many relationship)
load_orders: id, load_id, order_id, sequence_number, created_at

NOTE: Routes are NOT stored as fixed tables. Each load's route is dynamically 
calculated based on its specific orders' origin and destination geocodes.

-- FACILITIES TABLE (warehouses, distribution centers)
facilities: id, facility_code, facility_name, facility_type, address, city, state_province,
            country, postal_code, latitude, longitude, created_at, updated_at

-- CARRIERS TABLE (trucking companies)
carriers: id, name, mc_number, dot_number, contact_email, contact_phone, rate_per_mile,
          truck_types, rating, created_at, updated_at

-- PRODUCTS TABLE (product catalog)
products: id, product_id, name, description, carton_length_in, carton_width_in,
          carton_height_in, carton_weight_lbs, units_per_pallet, is_hazmat, hs_code,
          created_at, updated_at

-- COST_ANALYSIS TABLE (load cost breakdowns)
cost_analysis: id, load_id, base_freight_cost, fuel_surcharge, detention_fees,
               total_cost, cost_per_mile, analysis_data, created_at

COMMON QUERIES:
- Orders: status (Pending, Assigned, In Transit, Delivered), priority (Normal, High, Urgent)
- Loads: status (Planning, Scheduled, In Transit, Delivered), truck_type (Dry Van, Reefer, Flatbed)
- Facilities: facility_type (Warehouse, Distribution Center, Plant, Customer Site)
- Date ranges: Use BETWEEN, DATE_TRUNC, EXTRACT for temporal analysis
- Aggregations: COUNT, SUM, AVG, MAX, MIN with GROUP BY
"""
    
    def analyze_query(self, user_question, conversation_history=None):
        """
        Main entry point: analyze question, generate SQL, execute, format response
        Returns: {
            "success": bool,
            "sql": str,
            "data": list,
            "visualization": {"type": "table|bar|line|pie", "config": {}},
            "insight": str,
            "error": str (optional)
        }
        """
        try:
            # Step 1: Generate SQL from natural language
            sql_result = self._generate_sql(user_question, conversation_history)
            if not sql_result["success"]:
                return sql_result
            
            sql_query = sql_result["sql"]
            print(f"[MERTSIGHTS] Generated SQL: {sql_query}")
            
            # Step 2: Execute query safely
            data = self._execute_query(sql_query)
            if data is None:
                return {
                    "success": False,
                    "error": "Query execution failed or returned no data"
                }
            
            print(f"[MERTSIGHTS] Query returned {len(data)} rows")
            
            # Step 3: Determine visualization type using AI agent
            viz_config = self._determine_visualization(user_question, data)
            
            # Step 4: Generate chart image if matplotlib visualization is recommended
            chart_image = None
            if viz_config.get('useMatplotlib', False):
                chart_image = self._generate_chart(data, viz_config)
                if chart_image:
                    viz_config['chartImage'] = chart_image
            
            # Step 5: Generate natural language insight
            insight = self._generate_insight(user_question, data, sql_query)
            
            return {
                "success": True,
                "sql": sql_query,
                "data": data,
                "visualization": viz_config,
                "insight": insight
            }
            
        except Exception as e:
            print(f"[MERTSIGHTS ERROR] {str(e)}")
            return {
                "success": False,
                "error": f"Analysis failed: {str(e)}"
            }
    
    def _generate_sql(self, user_question, conversation_history=None):
        """Use Gemini to convert natural language to SQL"""
        
        # Build conversation context
        context = ""
        if conversation_history:
            context = "PREVIOUS CONVERSATION:\n"
            for msg in conversation_history[-3:]:  # Last 3 exchanges
                context += f"User: {msg.get('question', '')}\n"
                context += f"SQL: {msg.get('sql', '')}\n\n"
        
        prompt = f"""You are a SQL expert for a Transportation Management System (TMS) database.

{self.schema}

{context}

USER QUESTION: {user_question}

INSTRUCTIONS:
1. Generate a PostgreSQL query that answers the user's question
2. Use proper JOINs when relating tables (orders-loads via load_orders, loads-routes, etc.)
3. Return ONLY raw SQL, no markdown formatting, no explanations
4. Use aliases for clarity (o for orders, l for loads, etc.)
5. Limit results to 100 rows unless user asks for more
6. For aggregations, use appropriate GROUP BY
7. Handle NULLs gracefully with COALESCE when needed
8. Use date functions for temporal queries (DATE_TRUNC, EXTRACT)

SECURITY RULES (CRITICAL):
- READ-ONLY: Only SELECT queries allowed
- NO: INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE
- NO: Multiple statements (no semicolons except at end)
- NO: Comments in SQL (-- or /**/)

Generate the SQL query now:"""

        try:
            response = self.model.generate_content(prompt)
            sql = response.text.strip()
            
            # Clean up response (remove markdown code blocks if present)
            sql = re.sub(r'^```sql\s*', '', sql)
            sql = re.sub(r'^```\s*', '', sql)
            sql = re.sub(r'\s*```$', '', sql)
            sql = sql.strip()
            
            # Security validation
            if not self._validate_sql_safety(sql):
                return {
                    "success": False,
                    "error": "Generated query failed security validation (write operations not allowed)"
                }
            
            return {
                "success": True,
                "sql": sql
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"SQL generation failed: {str(e)}"
            }
    
    def _validate_sql_safety(self, sql):
        """Ensure query is read-only and safe"""
        sql_upper = sql.upper()
        
        # Block write operations
        dangerous_keywords = [
            'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
            'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
        ]
        
        for keyword in dangerous_keywords:
            if keyword in sql_upper:
                print(f"[MERTSIGHTS SECURITY] Blocked dangerous keyword: {keyword}")
                return False
        
        # Ensure only one statement (no semicolons except at end)
        semicolons = sql.count(';')
        if semicolons > 1:
            print(f"[MERTSIGHTS SECURITY] Multiple statements detected")
            return False
        
        # Must start with SELECT
        if not sql_upper.strip().startswith('SELECT'):
            print(f"[MERTSIGHTS SECURITY] Non-SELECT query blocked")
            return False
        
        return True
    
    def _execute_query(self, sql):
        """Execute SQL query safely and return results"""
        try:
            return self.db_client.execute_raw_query(sql)
        except Exception as e:
            print(f"[MERTSIGHTS QUERY ERROR] {str(e)}")
            return None
    
    def _generate_chart(self, data, viz_config):
        """Generate matplotlib/seaborn chart and return as base64 encoded image"""
        try:
            # Convert data to pandas DataFrame
            df = pd.DataFrame(data)
            
            # Set style for professional appearance
            sns.set_style("whitegrid")
            plt.rcParams['figure.figsize'] = (10, 6)
            plt.rcParams['font.size'] = 10
            
            # Create figure
            fig, ax = plt.subplots()
            
            chart_type = viz_config.get('type', 'bar')
            title = viz_config.get('title', 'Data Visualization')
            
            # Generate chart based on type
            if chart_type == 'histogram':
                column = viz_config.get('valueColumn') or df.select_dtypes(include=[np.number]).columns[0]
                sns.histplot(data=df, x=column, bins=20, kde=True, ax=ax, color='#176B91')
                ax.set_xlabel(column.replace('_', ' ').title())
                ax.set_ylabel('Frequency')
                
            elif chart_type == 'scatter':
                x_col = viz_config.get('xAxis') or df.columns[0]
                y_col = viz_config.get('yAxis') or df.columns[1]
                sns.scatterplot(data=df, x=x_col, y=y_col, ax=ax, color='#176B91', s=80, alpha=0.7)
                ax.set_xlabel(x_col.replace('_', ' ').title())
                ax.set_ylabel(y_col.replace('_', ' ').title())
                
                # Add regression line if data supports it
                try:
                    z = np.polyfit(df[x_col].astype(float), df[y_col].astype(float), 1)
                    p = np.poly1d(z)
                    ax.plot(df[x_col], p(df[x_col]), "r--", alpha=0.5, linewidth=2)
                except:
                    pass
                
            elif chart_type == 'line':
                x_col = viz_config.get('xAxis') or df.columns[0]
                y_col = viz_config.get('yAxis') or df.columns[1]
                
                # Sort by x-axis for proper line chart
                df_sorted = df.sort_values(by=x_col)
                
                ax.plot(df_sorted[x_col], df_sorted[y_col], marker='o', linewidth=2, 
                       markersize=6, color='#176B91', markerfacecolor='#46B1E1')
                ax.set_xlabel(x_col.replace('_', ' ').title())
                ax.set_ylabel(y_col.replace('_', ' ').title())
                ax.grid(True, alpha=0.3)
                
                # Rotate x-axis labels if many points or dates
                if len(df_sorted) > 10:
                    plt.xticks(rotation=45, ha='right')
                    
            elif chart_type == 'bar':
                x_col = viz_config.get('xAxis') or df.columns[0]
                y_col = viz_config.get('yAxis') or df.columns[1]
                
                # Limit to top 20 categories if too many
                if len(df) > 20:
                    df = df.nlargest(20, y_col)
                
                sns.barplot(data=df, x=x_col, y=y_col, ax=ax, color='#176B91')
                ax.set_xlabel(x_col.replace('_', ' ').title())
                ax.set_ylabel(y_col.replace('_', ' ').title())
                
                # Rotate labels if many categories
                if len(df) > 5:
                    plt.xticks(rotation=45, ha='right')
                    
            elif chart_type == 'pie':
                label_col = viz_config.get('labelColumn') or df.columns[0]
                value_col = viz_config.get('valueColumn') or df.columns[1]
                
                # Limit to top 8 slices
                if len(df) > 8:
                    df = df.nlargest(8, value_col)
                
                colors = ['#176B91', '#46B1E1', '#FF8042', '#00C49F', '#FFBB28', '#8884D8', '#82ca9d', '#ffc658']
                ax.pie(df[value_col], labels=df[label_col], autopct='%1.1f%%', 
                      startangle=90, colors=colors[:len(df)])
                ax.axis('equal')
                
            else:
                # Fallback: simple bar chart
                x_col = df.columns[0]
                y_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]
                sns.barplot(data=df, x=x_col, y=y_col, ax=ax, color='#176B91')
            
            # Set title
            ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
            
            # Tight layout to prevent label cutoff
            plt.tight_layout()
            
            # Convert to base64
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
            
            # Clean up
            plt.close(fig)
            buffer.close()
            
            print(f"[MERTSIGHTS] Generated {chart_type} chart ({len(data)} data points)")
            return f"data:image/png;base64,{image_base64}"
            
        except Exception as e:
            print(f"[MERTSIGHTS CHART ERROR] {str(e)}")
            return None
    
    def _determine_visualization(self, question, data):
        """Use Gemini agent to intelligently determine optimal visualization type"""
        
        if not data or len(data) == 0:
            return {"type": "text", "message": "No data found"}
        
        # Analyze data structure
        first_row = data[0]
        columns = list(first_row.keys())
        num_rows = len(data)
        
        # Check for numeric columns
        numeric_cols = []
        categorical_cols = []
        date_cols = []
        
        for col in columns:
            sample_val = first_row[col]
            if isinstance(sample_val, (int, float)) and col not in ['id', 'latitude', 'longitude']:
                numeric_cols.append(col)
            elif isinstance(sample_val, str):
                # Check if it's a date string
                if any(word in col.lower() for word in ['date', 'time', 'timestamp', 'created', 'updated']):
                    date_cols.append(col)
                else:
                    categorical_cols.append(col)
        
        # Build data summary for agent
        data_summary = f"""DATA STRUCTURE:
- Total rows: {num_rows}
- Columns: {', '.join(columns)}
- Numeric columns: {', '.join(numeric_cols) if numeric_cols else 'None'}
- Categorical columns: {', '.join(categorical_cols) if categorical_cols else 'None'}
- Date/time columns: {', '.join(date_cols) if date_cols else 'None'}

Sample data (first 3 rows):
{json.dumps(data[:3], default=str, indent=2)}
"""
        
        prompt = f"""You are a data visualization expert. Analyze the user's question and data structure to recommend the BEST visualization type.

USER QUESTION: {question}

{data_summary}

AVAILABLE CHART TYPES:
1. **line** - Best for: time series, trends over time, continuous data progression
   - Requires: x-axis (dates/categories), y-axis (numeric)
   - Use when: showing how values change over time or ordered categories

2. **bar** - Best for: comparing categories, ranking, side-by-side comparisons
   - Requires: x-axis (categories), y-axis (numeric)
   - Use when: comparing different groups or showing rankings

3. **histogram** - Best for: distribution analysis, frequency counts, data ranges
   - Requires: single numeric column
   - Use when: showing how data is distributed across ranges

4. **pie** - Best for: part-to-whole relationships, percentages (max 8 categories)
   - Requires: category labels, numeric values (should sum to meaningful total)
   - Use when: showing proportions of a whole

5. **scatter** - Best for: correlation analysis, relationship between two variables
   - Requires: two numeric columns
   - Use when: examining relationships or patterns between variables

6. **table** - Best for: detailed data, multiple columns, exact values needed
   - Use when: user needs specific values, many columns, or data isn't numeric

RULES:
- If >50 rows and no aggregation: use table (too many data points for chart)
- Histograms only work with single numeric column (no categories)
- Pie charts only if ≤8 categories and values sum meaningfully
- Time series data → line chart
- Comparison between groups → bar chart
- Distribution of single variable → histogram
- Correlation analysis → scatter plot

Respond with ONLY a JSON object (no markdown, no explanation):
{{
  "type": "line|bar|histogram|pie|scatter|table",
  "reasoning": "brief explanation why this is best",
  "title": "descriptive chart title",
  "xAxis": "column name" (for bar/line/scatter),
  "yAxis": "column name" (for bar/line/scatter),
  "valueColumn": "column name" (for histogram/pie),
  "labelColumn": "column name" (for pie),
  "useMatplotlib": true|false (true for histogram/scatter, false for others)
}}"""
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up response
            result_text = re.sub(r'^```json\s*', '', result_text)
            result_text = re.sub(r'^```\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)
            
            viz_config = json.loads(result_text)
            print(f"[MERTSIGHTS AGENT] Visualization decision: {viz_config['type']} - {viz_config.get('reasoning', '')}")
            
            return viz_config
            
        except Exception as e:
            print(f"[MERTSIGHTS AGENT ERROR] Visualization decision failed: {str(e)}")
            # Fallback to simple table
            return {
                "type": "table",
                "columns": columns,
                "title": "Query Results",
                "useMatplotlib": False
            }
    
    def _generate_insight(self, question, data, sql):
        """Generate natural language insight about the data"""
        
        if not data or len(data) == 0:
            return "No data found matching your query."
        
        # Get summary statistics
        num_rows = len(data)
        columns = list(data[0].keys())
        
        # Build data summary for LLM
        data_summary = f"Query returned {num_rows} rows with columns: {', '.join(columns)}\n\n"
        
        # Show first few rows
        data_summary += "Sample data:\n"
        for i, row in enumerate(data[:3]):
            data_summary += f"Row {i+1}: {json.dumps(row, default=str)}\n"
        
        # Calculate aggregates if numeric data present
        numeric_summaries = []
        for col in columns:
            values = [row[col] for row in data if isinstance(row.get(col), (int, float))]
            if values:
                numeric_summaries.append(f"{col}: min={min(values)}, max={max(values)}, avg={sum(values)/len(values):.2f}")
        
        if numeric_summaries:
            data_summary += "\nNumeric summaries:\n" + "\n".join(numeric_summaries)
        
        prompt = f"""You are mertsightsAI, a friendly data analyst for a Transportation Management System.

USER QUESTION: {question}

SQL EXECUTED: {sql}

DATA SUMMARY:
{data_summary}

Generate a brief, conversational insight (2-3 sentences) that:
1. Directly answers the user's question
2. Highlights key findings or patterns
3. Mentions specific numbers when relevant
4. Uses friendly language (avoid technical jargon)

Insight:"""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[MERTSIGHTS] Insight generation failed: {str(e)}")
            return f"Found {num_rows} results matching your query."

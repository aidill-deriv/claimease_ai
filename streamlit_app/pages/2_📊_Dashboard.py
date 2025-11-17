#!/usr/bin/env python3
"""
Dashboard Page - Personal claims overview and analytics
"""
import streamlit as st
import sys
from pathlib import Path
import pandas as pd
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.db_retriever import get_user_claims, calculate_balance, calculate_total_spent
from utils.ui_helpers import load_css, check_authentication, render_sidebar, render_page_header, create_metric_card

# Page config
st.set_page_config(
    page_title="Dashboard - ClaimEase",
    page_icon="📊",
    layout="wide"
)

# Load custom CSS
load_css()

def get_user_data(user_email):
    """Get user's claim data"""
    try:
        claims = get_user_claims(user_email)
        balance = calculate_balance(user_email)
        total_spent = calculate_total_spent(user_email)
        
        return {
            'claims': claims,
            'balance': balance,
            'total_spent': total_spent,
            'limit': 2000  # MYR 2,000 annual limit
        }
    except Exception as e:
        st.error(f"❌ Error loading data: {str(e)}")
        return None

def main():
    """Main dashboard page"""
    user_email = check_authentication()
    
    # Render sidebar
    render_sidebar()
    
    # Page header
    render_page_header(
        "My Dashboard",
        f"Welcome back, {user_email}!",
        "📊"
    )
    
    # Get user data
    data = get_user_data(user_email)
    
    if not data:
        st.markdown("""
            <div style="text-align: center; padding: 3rem;">
                <h3>No data available yet</h3>
                <p style="color: hsl(var(--muted-foreground));">
                    This might be your first time using the system. Submit your first claim to get started!
                </p>
            </div>
        """, unsafe_allow_html=True)
        if st.button("📋 Submit Your First Claim", type="primary"):
            st.switch_page("pages/3_📋_Submit_Claim.py")
        return
    
    # Key Metrics with modern cards
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(
            create_metric_card(
                "Remaining Balance",
                f"RM {data['balance']:.2f}",
                icon="💰"
            ),
            unsafe_allow_html=True
        )
    
    with col2:
        st.markdown(
            create_metric_card(
                "Total Spent",
                f"RM {data['total_spent']:.2f}",
                icon="💸"
            ),
            unsafe_allow_html=True
        )
    
    with col3:
        st.markdown(
            create_metric_card(
                "Total Claims",
                str(len(data['claims'])),
                icon="📋"
            ),
            unsafe_allow_html=True
        )
    
    with col4:
        st.markdown(
            create_metric_card(
                "Annual Limit",
                f"RM {data['limit']:.2f}",
                icon="🎯"
            ),
            unsafe_allow_html=True
        )
    
    # Progress section
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("""
        <div style="background: hsl(var(--card)); border: 1px solid hsl(var(--border));
                    border-radius: 1rem; padding: 1.5rem; margin: 1rem 0;">
            <h3 style="margin-bottom: 1rem; color: hsl(var(--foreground));">📈 Budget Usage</h3>
    """, unsafe_allow_html=True)
    
    progress = data['total_spent'] / data['limit']
    st.progress(progress)
    
    # Progress details
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(f"**Used:** RM {data['total_spent']:.2f}")
    with col2:
        st.markdown(f"**Remaining:** RM {data['balance']:.2f}")
    with col3:
        percentage = (data['total_spent'] / data['limit'] * 100)
        color = "green" if percentage < 50 else "orange" if percentage < 80 else "red"
        st.markdown(f"**Usage:** <span style='color: {color}; font-weight: bold;'>{percentage:.1f}%</span>", unsafe_allow_html=True)
    
    st.markdown("</div>", unsafe_allow_html=True)
    
    # Charts section
    st.markdown("<br>", unsafe_allow_html=True)
    col1, col2 = st.columns(2, gap="large")
    
    with col1:
        st.markdown("""
            <div style="background: hsl(var(--card)); border: 1px solid hsl(var(--border));
                        border-radius: 1rem; padding: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: hsl(var(--foreground));">📊 Spending by Category</h3>
        """, unsafe_allow_html=True)
        
        if data['claims']:
            df = pd.DataFrame(data['claims'])
            
            if 'category' in df.columns and 'amount' in df.columns:
                category_spending = df.groupby('category')['amount'].sum().reset_index()
                st.bar_chart(category_spending.set_index('category'), use_container_width=True)
            else:
                st.info("📊 No category data available")
        else:
            st.info("📊 No claims yet. Submit your first claim to see analytics!")
        
        st.markdown("</div>", unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
            <div style="background: hsl(var(--card)); border: 1px solid hsl(var(--border));
                        border-radius: 1rem; padding: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: hsl(var(--foreground));">📅 Monthly Trend</h3>
        """, unsafe_allow_html=True)
        
        if data['claims']:
            df = pd.DataFrame(data['claims'])
            
            if 'date' in df.columns and 'amount' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                df['month'] = df['date'].dt.to_period('M').astype(str)
                monthly_spending = df.groupby('month')['amount'].sum().reset_index()
                st.line_chart(monthly_spending.set_index('month'), use_container_width=True)
            else:
                st.info("📅 No date data available")
        else:
            st.info("📅 No claims yet")
        
        st.markdown("</div>", unsafe_allow_html=True)
    
    # Recent Claims Table
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("""
        <div style="background: hsl(var(--card)); border: 1px solid hsl(var(--border));
                    border-radius: 1rem; padding: 1.5rem; margin: 1rem 0;">
            <h3 style="margin-bottom: 1rem; color: hsl(var(--foreground));">📋 Recent Claims</h3>
    """, unsafe_allow_html=True)
    
    if data['claims']:
        df = pd.DataFrame(data['claims'])
        
        st.dataframe(
            df,
            use_container_width=True,
            hide_index=True
        )
        
        # Download button
        csv = df.to_csv(index=False)
        st.download_button(
            label="📥 Download Claims History (CSV)",
            data=csv,
            file_name=f"claims_history_{datetime.now().strftime('%Y%m%d')}.csv",
            mime="text/csv",
            use_container_width=True
        )
    else:
        st.info("📋 No claims found. Submit your first claim to get started!")
        if st.button("📋 Submit a Claim", use_container_width=True):
            st.switch_page("pages/3_📋_Submit_Claim.py")
    
    st.markdown("</div>", unsafe_allow_html=True)
    
    # Sidebar with insights
    with st.sidebar:
        st.markdown("---")
        st.markdown("### 💡 Insights")
        
        if data['balance'] < 500:
            st.warning(f"⚠️ **Low Balance**  \nRM {data['balance']:.2f} remaining")
        elif data['balance'] > 1500:
            st.success(f"✅ **Good Balance**  \nRM {data['balance']:.2f} available")
        else:
            st.info(f"ℹ️ **Current Balance**  \nRM {data['balance']:.2f}")
        
        st.markdown("---")
        
        # Quick stats
        if data['claims']:
            df = pd.DataFrame(data['claims'])
            
            st.markdown("### 📈 Quick Stats")
            
            if 'category' in df.columns:
                most_used = df['category'].mode()[0] if not df['category'].mode().empty else "N/A"
                st.markdown(f"**Most Used:**  \n{most_used}")
            
            if 'amount' in df.columns:
                avg_claim = df['amount'].mean()
                st.markdown(f"**Avg Claim:**  \nRM {avg_claim:.2f}")
                
                max_claim = df['amount'].max()
                st.markdown(f"**Largest Claim:**  \nRM {max_claim:.2f}")

if __name__ == "__main__":
    main()

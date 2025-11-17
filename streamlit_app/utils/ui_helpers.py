"""
UI Helper Functions for ClaimEase
Provides consistent styling and components across all pages
"""
import streamlit as st
from pathlib import Path

def load_css():
    """Load custom CSS styles for the application"""
    css_file = Path(__file__).parent.parent / "assets" / "styles.css"
    if css_file.exists():
        with open(css_file) as f:
            st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

def check_authentication():
    """Check if user is authenticated, redirect to login if not"""
    if 'authenticated' not in st.session_state or not st.session_state.authenticated:
        st.warning("⚠️ Please login first")
        st.stop()
    return st.session_state.user_email

def render_sidebar():
    """Render consistent sidebar across all pages"""
    with st.sidebar:
        st.markdown("### 👤 User")
        if 'user_email' in st.session_state:
            st.markdown(f"**{st.session_state.user_email}**")
        st.markdown("---")
        
        st.markdown("### 📱 Navigation")
        st.page_link("app.py", label="🏠 Home")
        st.page_link("pages/1_💬_Chat.py", label="💬 Chat Assistant")
        st.page_link("pages/2_📊_Dashboard.py", label="📊 My Dashboard")
        st.page_link("pages/3_📋_Submit_Claim.py", label="📋 Submit Claim")
        
        st.markdown("---")
        if st.button("🚪 Logout", use_container_width=True):
            st.session_state.authenticated = False
            st.session_state.user_email = None
            st.switch_page("app.py")

def render_page_header(title, subtitle=None, icon=""):
    """Render consistent page header"""
    st.markdown(f"""
        <div style="text-align: center; padding: 2rem 0 1rem 0;">
            <h1 style="font-size: 2.5rem; font-weight: 800; 
                       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                       -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                       background-clip: text; margin-bottom: 0.5rem;">
                {icon} {title}
            </h1>
            {f'<p style="font-size: 1.1rem; color: hsl(var(--muted-foreground));">{subtitle}</p>' if subtitle else ''}
        </div>
    """, unsafe_allow_html=True)

def create_metric_card(label, value, delta=None, icon=""):
    """Create a modern metric card"""
    delta_html = ""
    if delta:
        delta_color = "green" if delta > 0 else "red"
        delta_html = f'<span style="color: {delta_color}; font-size: 0.9rem;">{"+" if delta > 0 else ""}{delta}</span>'
    
    return f"""
        <div style="background: hsl(var(--card)); border: 1px solid hsl(var(--border));
                    border-radius: 1rem; padding: 1.5rem; text-align: center;
                    transition: all 0.3s ease;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">{icon}</div>
            <div style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); 
                        text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
                {label}
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: hsl(var(--primary));">
                {value}
            </div>
            {delta_html}
        </div>
    """

def create_info_box(title, content, type="info"):
    """Create an info box with different types (info, success, warning, error)"""
    colors = {
        "info": ("hsl(var(--primary))", "hsl(var(--primary) / 0.1)", "hsl(var(--primary) / 0.3)"),
        "success": ("hsl(142.1 76.2% 36.3%)", "hsl(142.1 76.2% 36.3% / 0.1)", "hsl(142.1 76.2% 36.3% / 0.3)"),
        "warning": ("hsl(38 92% 50%)", "hsl(38 92% 50% / 0.1)", "hsl(38 92% 50% / 0.3)"),
        "error": ("hsl(var(--destructive))", "hsl(var(--destructive) / 0.1)", "hsl(var(--destructive) / 0.3)")
    }
    
    color, bg, border = colors.get(type, colors["info"])
    
    return f"""
        <div style="background: {bg}; border: 1px solid {border}; border-radius: 0.5rem;
                    padding: 1rem; margin: 1rem 0;">
            <div style="font-weight: 600; color: {color}; margin-bottom: 0.5rem;">{title}</div>
            <div style="color: hsl(var(--foreground));">{content}</div>
        </div>
    """

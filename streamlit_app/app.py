#!/usr/bin/env python3
"""
ClaimEase Web Portal - Main Streamlit Application
AI-powered employee claims and benefits management system
"""
import streamlit as st
import os
from pathlib import Path

# Set page config (must be first Streamlit command)
st.set_page_config(
    page_title="ClaimEase - Employee Claims Portal",
    page_icon="💼",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load custom CSS
def load_css():
    css_file = Path(__file__).parent / "assets" / "styles.css"
    if css_file.exists():
        with open(css_file) as f:
            st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)
    
    # Additional inline styles for this page
    st.markdown("""
        <style>
        /* Hero Section */
        .hero-section {
            text-align: center;
            padding: 3rem 0 2rem 0;
            margin-bottom: 2rem;
        }
        
        .hero-title {
            font-size: 3.5rem !important;
            font-weight: 800 !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem !important;
            letter-spacing: -0.03em;
        }
        
        .hero-subtitle {
            font-size: 1.25rem;
            color: hsl(var(--muted-foreground));
            margin-bottom: 2rem;
            font-weight: 400;
        }
        
        /* Feature Cards */
        .feature-card {
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 1rem;
            padding: 2rem;
            height: 100%;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        
        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border-color: hsl(var(--primary) / 0.3);
        }
        
        .feature-card:hover::before {
            transform: scaleX(1);
        }
        
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        .feature-title {
            font-size: 1.5rem !important;
            font-weight: 700 !important;
            color: hsl(var(--foreground)) !important;
            margin-bottom: 0.75rem !important;
        }
        
        .feature-description {
            color: hsl(var(--muted-foreground));
            line-height: 1.6;
            font-size: 0.95rem;
        }
        
        /* Info Cards */
        .info-card {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border: 1px solid hsl(var(--border));
            border-radius: 1rem;
            padding: 1.5rem;
            height: 100%;
        }
        
        .info-card h3 {
            color: hsl(var(--primary)) !important;
            font-size: 1.25rem !important;
            margin-bottom: 1rem !important;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .info-card ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .info-card li {
            padding: 0.5rem 0;
            color: hsl(var(--foreground));
            display: flex;
            align-items: start;
            gap: 0.5rem;
        }
        
        .info-card li::before {
            content: "✓";
            color: hsl(var(--primary));
            font-weight: bold;
            flex-shrink: 0;
        }
        
        /* Login Card */
        .login-card {
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 1rem;
            padding: 3rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            margin: 2rem auto;
        }
        
        .login-title {
            font-size: 2rem !important;
            font-weight: 700 !important;
            text-align: center;
            margin-bottom: 2rem !important;
            color: hsl(var(--foreground)) !important;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 3rem 0 2rem 0;
            margin-top: 4rem;
            border-top: 1px solid hsl(var(--border));
        }
        
        .footer-text {
            color: hsl(var(--muted-foreground));
            font-size: 0.9rem;
            margin: 0.5rem 0;
        }
        
        .footer-version {
            color: hsl(var(--muted-foreground));
            font-size: 0.85rem;
            opacity: 0.7;
        }
        </style>
    """, unsafe_allow_html=True)

load_css()

def main():
    """Main application entry point"""
    
    # Check if user is authenticated
    if 'authenticated' not in st.session_state:
        st.session_state.authenticated = False
    
    if not st.session_state.authenticated:
        show_login_page()
    else:
        show_home_page()

def show_login_page():
    """Display modern login page"""
    
    # Hero Section
    st.markdown("""
        <div class="hero-section">
            <h1 class="hero-title">💼 ClaimEase</h1>
            <p class="hero-subtitle">Your AI-Powered Claims & Benefits Assistant</p>
        </div>
    """, unsafe_allow_html=True)
    
    # Login Card
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.markdown('<div class="login-card">', unsafe_allow_html=True)
        st.markdown('<h2 class="login-title">🔐 Welcome Back</h2>', unsafe_allow_html=True)
        
        email = st.text_input(
            "Email Address",
            placeholder="your.email@deriv.com",
            label_visibility="collapsed"
        )
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        if st.button("Sign In", type="primary", use_container_width=True):
            if email and "@" in email:
                st.session_state.authenticated = True
                st.session_state.user_email = email.strip().lower()
                st.rerun()
            else:
                st.error("⚠️ Please enter a valid email address")
        
        st.markdown("<br>", unsafe_allow_html=True)
        st.info("💡 **Demo Mode**: Enter any valid email to access the portal")
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Features Preview
    st.markdown("<br><br>", unsafe_allow_html=True)
    st.markdown("### ✨ What You Can Do")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
            <div class="info-card">
                <h3>💬 AI Chat Assistant</h3>
                <ul>
                    <li>Ask questions about claims</li>
                    <li>Get instant policy answers</li>
                    <li>24/7 availability</li>
                </ul>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
            <div class="info-card">
                <h3>📊 Smart Dashboard</h3>
                <ul>
                    <li>Track your balance</li>
                    <li>View claim history</li>
                    <li>Spending analytics</li>
                </ul>
            </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
            <div class="info-card">
                <h3>📋 Easy Submission</h3>
                <ul>
                    <li>Submit claims online</li>
                    <li>Upload documents</li>
                    <li>Track status</li>
                </ul>
            </div>
        """, unsafe_allow_html=True)

def show_home_page():
    """Display modern home page after login"""
    
    # Sidebar
    with st.sidebar:
        st.markdown("### 👤 Welcome!")
        st.markdown(f"**{st.session_state.user_email}**")
        st.markdown("---")
        
        st.markdown("### 📱 Navigation")
        st.page_link("pages/1_💬_Chat.py", label="💬 Chat Assistant")
        st.page_link("pages/2_📊_Dashboard.py", label="📊 My Dashboard")
        st.page_link("pages/3_📋_Submit_Claim.py", label="📋 Submit Claim")
        
        st.markdown("---")
        if st.button("🚪 Logout", use_container_width=True):
            st.session_state.authenticated = False
            st.session_state.user_email = None
            st.rerun()
    
    # Hero Section
    st.markdown("""
        <div class="hero-section">
            <h1 class="hero-title">Welcome to ClaimEase</h1>
            <p class="hero-subtitle">What would you like to do today?</p>
        </div>
    """, unsafe_allow_html=True)
    
    # Feature Cards
    col1, col2, col3 = st.columns(3, gap="large")
    
    with col1:
        st.markdown("""
            <div class="feature-card">
                <span class="feature-icon">💬</span>
                <h3 class="feature-title">Chat Assistant</h3>
                <p class="feature-description">
                    Ask questions about your claims, benefits, and policies. 
                    Get instant AI-powered answers 24/7!
                </p>
            </div>
        """, unsafe_allow_html=True)
        if st.button("Start Chatting", key="chat_btn", use_container_width=True):
            st.switch_page("pages/1_💬_Chat.py")
    
    with col2:
        st.markdown("""
            <div class="feature-card">
                <span class="feature-icon">📊</span>
                <h3 class="feature-title">My Dashboard</h3>
                <p class="feature-description">
                    View your claim balance, spending trends, and complete 
                    claim history at a glance.
                </p>
            </div>
        """, unsafe_allow_html=True)
        if st.button("View Dashboard", key="dashboard_btn", use_container_width=True):
            st.switch_page("pages/2_📊_Dashboard.py")
    
    with col3:
        st.markdown("""
            <div class="feature-card">
                <span class="feature-icon">📋</span>
                <h3 class="feature-title">Submit Claim</h3>
                <p class="feature-description">
                    Submit new claims for dental, optical, or health 
                    screening expenses quickly and easily.
                </p>
            </div>
        """, unsafe_allow_html=True)
        if st.button("Submit Claim", key="submit_btn", use_container_width=True):
            st.switch_page("pages/3_📋_Submit_Claim.py")
    
    # Information Section
    st.markdown("<br><br>", unsafe_allow_html=True)
    st.markdown("## 📚 Your Benefits Overview")
    
    col1, col2 = st.columns(2, gap="large")
    
    with col1:
        st.markdown("""
            <div class="info-card">
                <h3>🏥 AIA Medical Insurance</h3>
                <ul>
                    <li><strong>Annual Limit:</strong> RM 150,000</li>
                    <li><strong>Coverage:</strong> GP, Specialist, Hospital</li>
                    <li><strong>Method:</strong> Cashless at panel clinics</li>
                    <li><strong>Emergency Hotline:</strong> 1300 8888 60/70</li>
                    <li><strong>Claim Deadline:</strong> 30 days from treatment</li>
                </ul>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
            <div class="info-card">
                <h3>💰 Deriv Health Benefits</h3>
                <ul>
                    <li><strong>Annual Limit:</strong> MYR 2,000</li>
                    <li><strong>Coverage:</strong> Dental, Optical, Health Screening</li>
                    <li><strong>Method:</strong> Reimbursement via Sage People</li>
                    <li><strong>Contact:</strong> my-hrops@deriv.com</li>
                    <li><strong>Claim Deadline:</strong> Same month as service</li>
                </ul>
            </div>
        """, unsafe_allow_html=True)
    
    # Footer
    st.markdown("""
        <div class="footer">
            <p class="footer-text">
                💡 Need help? Use the Chat Assistant or contact HR at 
                <strong>my-hrops@deriv.com</strong>
            </p>
            <p class="footer-version">ClaimEase v1.0.0 | Powered by AI</p>
        </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()

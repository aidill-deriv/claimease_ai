#!/usr/bin/env python3
"""
Submit Claim Page - Form for submitting new claims
"""
import streamlit as st
import sys
from pathlib import Path
from datetime import datetime, date

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.ui_helpers import load_css, check_authentication, render_sidebar, render_page_header, create_info_box

# Page config
st.set_page_config(
    page_title="Submit Claim - ClaimEase",
    page_icon="📋",
    layout="wide"
)

# Load custom CSS
load_css()

def main():
    """Main submit claim page"""
    user_email = check_authentication()
    
    # Render sidebar
    render_sidebar()
    
    # Page header
    render_page_header(
        "Submit a Claim",
        "Fill out the form below to submit your claim for reimbursement",
        "📋"
    )
    
    # Information box
    st.markdown(
        create_info_box(
            "📌 Important Information",
            """
            • Claims must be submitted within the <strong>same month</strong> as the service date<br>
            • Annual limit: <strong>MYR 2,000</strong> for dental, optical, and health screening<br>
            • Receipts must have your <strong>name</strong> on them<br>
            • Get <strong>approval</strong> from authorized person before submitting<br>
            • <strong>No e-invoice needed</strong> for employee benefits
            """,
            type="info"
        ),
        unsafe_allow_html=True
    )
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Two columns layout
    col1, col2 = st.columns([2, 1], gap="large")
    
    with col1:
        st.markdown("""
            <div style="background: hsl(var(--card)); border: 1px solid hsl(var(--border));
                        border-radius: 1rem; padding: 2rem;">
                <h3 style="margin-bottom: 1.5rem; color: hsl(var(--foreground));">📝 Claim Details</h3>
        """, unsafe_allow_html=True)
        
        # Claim form
        with st.form("claim_form"):
            # Category selection
            category = st.selectbox(
                "Claim Category *",
                ["Dental", "Optical", "Health Screening"],
                help="Select the type of claim you're submitting"
            )
            
            # Amount
            amount = st.number_input(
                "Claim Amount (MYR) *",
                min_value=0.0,
                max_value=2000.0,
                step=10.0,
                help="Enter the amount you're claiming"
            )
            
            # Date
            claim_date = st.date_input(
                "Service Date *",
                max_value=date.today(),
                help="Date when you received the service"
            )
            
            # Provider
            provider = st.text_input(
                "Service Provider *",
                placeholder="e.g., Dr. Lee's Dental Clinic",
                help="Name of the clinic/hospital/provider"
            )
            
            # Description
            description = st.text_area(
                "Description",
                placeholder="e.g., Dental cleaning and filling",
                help="Brief description of the service received",
                height=100
            )
            
            # Receipt upload
            st.markdown("#### 📎 Upload Receipt")
            receipt_file = st.file_uploader(
                "Upload your receipt (PDF, JPG, PNG) *",
                type=['pdf', 'jpg', 'jpeg', 'png'],
                help="Receipt must have your name on it"
            )
            
            # Approval
            st.markdown("#### ✅ Approval")
            approver = st.text_input(
                "Authorized Person *",
                placeholder="Name of person who approved this claim",
                help="Get approval before submitting"
            )
            
            # Terms
            agree = st.checkbox(
                "I confirm that all information provided is accurate and I have obtained necessary approval",
                value=False
            )
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            # Submit button
            col_btn1, col_btn2 = st.columns(2)
            with col_btn1:
                submitted = st.form_submit_button(
                    "📤 Submit Claim",
                    type="primary",
                    use_container_width=True
                )
            with col_btn2:
                if st.form_submit_button("🔄 Reset Form", use_container_width=True):
                    st.rerun()
            
            # Handle submission
            if submitted:
                if not all([category, amount > 0, claim_date, provider, receipt_file, approver, agree]):
                    st.error("❌ Please fill in all required fields and upload receipt")
                else:
                    # Success message
                    st.success("✅ Claim submitted successfully!")
                    st.balloons()
                    
                    # Show summary in a nice card
                    st.markdown("<br>", unsafe_allow_html=True)
                    st.markdown("""
                        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                                    border: 1px solid hsl(var(--primary) / 0.3);
                                    border-radius: 1rem; padding: 1.5rem; margin: 1rem 0;">
                            <h4 style="color: hsl(var(--primary)); margin-bottom: 1rem;">📋 Claim Summary</h4>
                    """, unsafe_allow_html=True)
                    
                    col_s1, col_s2 = st.columns(2)
                    with col_s1:
                        st.markdown(f"**Category:** {category}")
                        st.markdown(f"**Amount:** MYR {amount:.2f}")
                        st.markdown(f"**Date:** {claim_date.strftime('%d %B %Y')}")
                    with col_s2:
                        st.markdown(f"**Provider:** {provider}")
                        st.markdown(f"**Approved by:** {approver}")
                        st.markdown(f"**Receipt:** {receipt_file.name}")
                    
                    st.markdown("</div>", unsafe_allow_html=True)
                    
                    st.markdown(
                        create_info_box(
                            "📬 Next Steps",
                            """
                            1. Your claim will be reviewed by HR<br>
                            2. You'll receive an email notification once processed<br>
                            3. Processing typically takes 3-5 business days<br>
                            4. Check your dashboard for status updates
                            """,
                            type="success"
                        ),
                        unsafe_allow_html=True
                    )
                    
                    if st.button("📊 View Dashboard", use_container_width=True):
                        st.switch_page("pages/2_📊_Dashboard.py")
        
        st.markdown("</div>", unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
            <div style="background: hsl(var(--card)); border: 1px solid hsl(var(--border));
                        border-radius: 1rem; padding: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: hsl(var(--foreground));">💡 Quick Guide</h3>
        """, unsafe_allow_html=True)
        
        with st.expander("🦷 **Dental Claims**", expanded=False):
            st.markdown("""
            **✅ Covered:**
            - Dental cleaning
            - Fillings
            - Extractions
            - Root canal
            - Dentures
            
            **❌ Not Covered:**
            - Cosmetic procedures
            - Teeth whitening
            - Braces (unless medically necessary)
            """)
        
        with st.expander("👓 **Optical Claims**", expanded=False):
            st.markdown("""
            **✅ Covered:**
            - Eye examination
            - Prescription glasses
            - Contact lenses
            - Lens replacement
            
            **❌ Not Covered:**
            - Non-prescription sunglasses
            - Cosmetic contact lenses
            - LASIK surgery
            """)
        
        with st.expander("🏥 **Health Screening**", expanded=False):
            st.markdown("""
            **✅ Covered:**
            - Annual health check-up
            - Blood tests
            - X-rays
            - Ultrasound
            - ECG
            
            **❌ Not Covered:**
            - Cosmetic procedures
            - Experimental treatments
            """)
        
        st.markdown("</div>", unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.markdown("""
            <div style="background: hsl(var(--card)); border: 1px solid hsl(var(--border));
                        border-radius: 1rem; padding: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: hsl(var(--foreground));">📞 Need Help?</h3>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        **HR Operations:**  
        📧 my-hrops@deriv.com
        
        **Claim Form:**  
        🔗 [ClickUp Form](https://forms.clickup.com/20696747/f/kqknb-810315/DFDX4GPVELIFPNN9VA)
        
        **Chat Assistant:**  
        💬 Ask questions anytime
        """)
        
        if st.button("💬 Chat with Assistant", use_container_width=True):
            st.switch_page("pages/1_💬_Chat.py")
        
        st.markdown("</div>", unsafe_allow_html=True)

if __name__ == "__main__":
    main()

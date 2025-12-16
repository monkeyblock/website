(function() {
  'use strict';
  
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode && /^[A-Za-z0-9]{4,20}$/.test(refCode)) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `mb_referral=${refCode}; expires=${expires}; path=/; SameSite=Lax`;
    localStorage.setItem('mb_referral', refCode);
    localStorage.setItem('mb_referral_timestamp', Date.now().toString());
    
    if (typeof amplitude !== 'undefined') {
      amplitude.track('Referral Landing', { referral_code: refCode });
    }
    
    showReferralBanner();
  }
  
  function showReferralBanner() {
    if (sessionStorage.getItem('mb_referral_banner_dismissed')) return;
    
    const init = () => {
      const banner = document.createElement('div');
      banner.id = 'mb-referral-banner';
      banner.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0;
        background: linear-gradient(135deg, #7a9b8e 0%, #5d7a6e 100%);
        color: white; padding: 12px 20px; text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px; z-index: 99999; box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        display: flex; align-items: center; justify-content: center; gap: 12px;
      `;
      
      banner.innerHTML = `
        <span>🎁 You were invited by a friend! Sign up now and get <strong>7 days Pro free</strong>!</span>
        <button id="mb-referral-dismiss" style="
          background: rgba(255,255,255,0.2); border: none; color: white;
          padding: 6px 14px; border-radius: 6px; cursor: pointer;
        ">✕</button>
      `;
      
      document.body.insertBefore(banner, document.body.firstChild);
      document.body.style.paddingTop = banner.offsetHeight + 'px';
      
      document.getElementById('mb-referral-dismiss').addEventListener('click', () => {
        banner.remove();
        document.body.style.paddingTop = '0';
        sessionStorage.setItem('mb_referral_banner_dismissed', 'true');
      });
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();

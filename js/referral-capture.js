/**
 * Monkey Block - Referral Code Capture
 * Speichert Referral-Codes aus URL-Parametern für spätere Übertragung an die Extension
 * 
 * Flow:
 * 1. User besucht monkey-block.com/?ref=ABC123
 * 2. Dieses Script speichert den Code in Cookie + localStorage
 * 3. Nach Extension-Installation liest das Content Script den Code
 * 4. Bei Account-Erstellung wird der Code an Supabase gesendet
 */
(function() {
  'use strict';
  
  // Referral-Code aus URL extrahieren
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    // Validierung: nur alphanumerisch, 4-20 Zeichen
    if (/^[A-Za-z0-9]{4,20}$/.test(refCode)) {
      
      // 1. In Cookie speichern (30 Tage, für Cross-Session)
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `mb_referral=${refCode}; expires=${expires}; path=/; SameSite=Lax`;
      
      // 2. In localStorage speichern (Backup)
      localStorage.setItem('mb_referral', refCode);
      localStorage.setItem('mb_referral_timestamp', Date.now().toString());
      
      console.log('[Monkey Block] ✅ Referral code captured:', refCode);
      
      // 3. Optional: Visuelles Feedback für den User
      showReferralBanner(refCode);
      
      // 4. Track referral landing in analytics
      if (typeof amplitude !== 'undefined') {
        amplitude.track('Referral Landing', {
          referral_code: refCode,
          landing_page: window.location.pathname
        });
      }
      
    } else {
      console.warn('[Monkey Block] Invalid referral code format:', refCode);
    }
  }
  
  /**
   * Zeigt ein dezentes Banner an, dass der User eingeladen wurde
   */
  function showReferralBanner(code) {
    // Nur anzeigen wenn noch nicht dismissed in dieser Session
    if (sessionStorage.getItem('mb_referral_banner_dismissed')) return;
    
    // Warte bis DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => createBanner(code));
    } else {
      createBanner(code);
    }
  }
  
  function createBanner(code) {
    const banner = document.createElement('div');
    banner.id = 'mb-referral-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #7a9b8e 0%, #5d7a6e 100%);
      color: white;
      padding: 12px 20px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 99999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    `;
    
    banner.innerHTML = `
      <span>🎁 Du wurdest von einem Freund eingeladen! Installiere Monkey Block und ihr bekommt beide <strong>kostenlose Pro-Zeit</strong>.</span>
      <button id="mb-referral-dismiss" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.2s;
      ">✕</button>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Dismiss handler
    document.getElementById('mb-referral-dismiss').addEventListener('click', () => {
      banner.remove();
      sessionStorage.setItem('mb_referral_banner_dismissed', 'true');
    });
    
    // Hover effect
    const dismissBtn = document.getElementById('mb-referral-dismiss');
    dismissBtn.addEventListener('mouseenter', () => {
      dismissBtn.style.background = 'rgba(255,255,255,0.3)';
    });
    dismissBtn.addEventListener('mouseleave', () => {
      dismissBtn.style.background = 'rgba(255,255,255,0.2)';
    });
    
    // Adjust body padding to account for banner
    document.body.style.paddingTop = banner.offsetHeight + 'px';
  }
  
  // Auch prüfen ob bereits ein Referral-Code gespeichert ist (für Debug)
  const existingCode = localStorage.getItem('mb_referral');
  if (existingCode && !refCode) {
    console.log('[Monkey Block] Existing referral code found:', existingCode);
  }
  
})();

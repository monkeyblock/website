// Amplitude Feedback Debug Script
// Run this in the browser console on the feedback page

(async function debugAmplitude() {
    console.log('=== AMPLITUDE DEBUG START ===');
    
    // 1. Check if AmplitudeFeedback is loaded
    if (typeof AmplitudeFeedback === 'undefined') {
        console.error('❌ AmplitudeFeedback class not found!');
        return;
    }
    console.log('✅ AmplitudeFeedback class loaded');
    
    // 2. Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    console.log('\n📍 URL Parameters:');
    console.log('- uid:', urlParams.get('uid') || '❌ MISSING');
    console.log('- did:', urlParams.get('did') || '❌ MISSING');
    console.log('- install_date:', urlParams.get('install_date') || '❌ MISSING');
    console.log('- v:', urlParams.get('v') || '❌ MISSING');
    console.log('- ext_id:', urlParams.get('ext_id') || '❌ MISSING');
    
    // 3. Initialize and check instance
    console.log('\n🔧 Initializing Amplitude...');
    const amp = new AmplitudeFeedback();
    await amp.init();
    
    console.log('\n👤 User Identification:');
    console.log('- User ID:', amp.userId || '❌ NOT SET');
    console.log('- Device ID:', amp.deviceId || '❌ NOT SET');
    console.log('- Install Date:', amp.installDate || '❌ NOT SET');
    console.log('- Install Date Source:', amp.installDateSource || '❌ NOT SET');
    console.log('- Days Used:', amp.daysUsed !== null ? amp.daysUsed : '❌ NOT SET');
    
    // 4. Test API connectivity
    console.log('\n🌐 Testing API Connectivity...');
    try {
        const testEvent = {
            user_id: amp.userId || 'debug_test_user',
            device_id: amp.deviceId || 'debug_test_device',
            session_id: Date.now(),
            event_type: 'Debug Test Event',
            event_properties: {
                debug: true,
                timestamp: new Date().toISOString()
            },
            time: Date.now(),
            ip: '$remote'
        };
        
        console.log('Sending test event:', testEvent);
        
        const response = await fetch(amp.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            body: JSON.stringify({
                api_key: amp.apiKey,
                events: [testEvent]
            })
        });
        
        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response:', responseText);
        
        if (response.ok) {
            console.log('✅ API connection successful!');
        } else {
            console.error('❌ API request failed:', response.status, responseText);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
    
    // 5. Check existing amplitude instance
    if (window.amplitudeTracker) {
        console.log('\n📊 Existing amplitudeTracker found:');
        console.log('- User ID:', window.amplitudeTracker.userId);
        console.log('- Device ID:', window.amplitudeTracker.deviceId);
        console.log('- Session ID:', window.amplitudeTracker.sessionId);
    }
    
    // 6. Monitor network requests
    console.log('\n🔍 Monitoring Amplitude requests...');
    console.log('Open Network tab and filter by "amplitude" to see requests');
    
    // Override fetch to log Amplitude requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        if (args[0] && args[0].includes('amplitude')) {
            console.log('📤 Amplitude Request:', args[0]);
            if (args[1] && args[1].body) {
                try {
                    const body = JSON.parse(args[1].body);
                    console.log('Request body:', body);
                } catch (e) {
                    console.log('Request body (raw):', args[1].body);
                }
            }
        }
        return originalFetch.apply(this, args);
    };
    
    console.log('\n=== AMPLITUDE DEBUG END ===');
    console.log('💡 Try selecting a reason and submitting feedback to see live requests');
})();

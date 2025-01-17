( function () {
    'use strict';

    const domainRegex = /^(ark\.fandom|ark\.gamepedia|ark-[a-z]+\.gamepedia)\.com$/i;

    let isAddonDisabled = false;
    const storage = chrome && chrome.storage || window.storage;


    function updateIcon() {
        const icon = {
            path: ( isAddonDisabled ? '/icons/32_black.png' : '/icons/32.png' )
        };
        if ( chrome && chrome.action && chrome.action.setIcon ) {
            chrome.action.setIcon( icon );
        } else {
            chrome.browserAction.setIcon( icon );
        }
    }


    // Redirect from Fandom onto the official wiki
    chrome.webNavigation.onBeforeNavigate.addListener( info => {
        if ( isAddonDisabled ) {
            return;
        }

        const url = new URL( info.url );

        // Check if the URL matches our regex
        if ( !domainRegex.test( url.host ) ) {
            return;
        }

        const oldWikiDomain = url.host.split( '.' )[0].toLowerCase();
        let newWikiDomain = null;
        let newPath = url.pathname;

        switch ( oldWikiDomain ) {
            case 'ark':
                newWikiDomain = oldWikiDomain;
                break;
            // Remap legacy translation links (gamepedia.com) onto the new URI-based scheme
            case 'ark-de':
            case 'ark-es':
            case 'ark-fr':
            case 'ark-it':
            case 'ark-ja':
            case 'ark-pl':
            case 'ark-ptbr':
            case 'ark-ru':
                let languageCode = oldWikiDomain.split( '-' )[1];
                // PT-BR needs special treatment
                if ( languageCode == 'ptbr' ) {
                    languageCode = 'pt-br';
                }

                newWikiDomain = 'ark';
                newPath = `/${ languageCode }${ newPath }`;
                break;
        };

        // If mapping failed, don't do anything
        if ( !newWikiDomain ) {
            return;
        }

        chrome.tabs.update( info.tabId, {
            url: `https://${ newWikiDomain }.wiki.gg${ newPath }`
        } );
    });


    function updateIsEnabled() {
        storage.local.get( [ 'isRedirectDisabled' ], result => {
            isAddonDisabled = result ? result.isRedirectDisabled : false;
            updateIcon();
        } );
    }


    storage.onChanged.addListener( ( changes, _ ) => {
        updateIsEnabled();
    } );
    updateIsEnabled();
} )();

Analytics.Scene.Oauth = Class.create(Analytics.Util.Base, {
    initialize : function ($super, oauthConfig)
    {
        this.method = null;
        this.oauth_verifier = null;
        this.displayName = oauthConfig.displayName;
        this.accountId = oauthConfig.accountId;
        this.authScope = oauthConfig.authScope;
        this.callbackScene = oauthConfig.callbackScene;
        this.requestTokenUrl = oauthConfig.requestTokenUrl;
        this.authorizeUrl = oauthConfig.authorizeUrl;
        this.accessTokenUrl = oauthConfig.accessTokenUrl;
        this.consumer_key = oauthConfig.consumer_key;
        this.consumer_key_secret = oauthConfig.consumer_key_secret;
        if (oauthConfig.callback != undefined) {
            this.callback = oauthConfig.callback;
        }
        else {
            this.callback = 'oob';
        }
        if (oauthConfig.requestTokenMethod != undefined) {
            this.requestTokenMethod = oauthConfig.requestTokenMethod;
        }
        else {
            this.requestTokenMethod = 'GET';
        }
        if (oauthConfig.accessTokenMethod != undefined) {
            this.accessTokenMethod = oauthConfig.accessTokenMethod;
        }
        else {
            this.accessTokenMethod = 'GET';
        }
        this.url = '';
        this.requested_token = '';
        this.exchangingToken = false;
    },
    
    setup: function ()
    {
        this.controller.setupWidget('browser', {}, this.storyViewModel = {});
        this.reloadModel = {
            label: $L('Reload'),
            icon: 'refresh',
            command: 'refresh'
        };
        this.stopModel = {
            label: $L('Stop'),
            icon: 'load-progress',
            command: 'stop'
        };
        this.cmdMenuModel = {
            visible: true,
            items: [{}, this.reloadModel]
        };
        this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass:'no-fade'}, this.cmdMenuModel);
        Mojo.Event.listen(this.controller.get('browser'), Mojo.Event.webViewLoadProgress, this.loadProgress.bind(this));
        Mojo.Event.listen(this.controller.get('browser'), Mojo.Event.webViewLoadStarted, this.loadStarted.bind(this));
        Mojo.Event.listen(this.controller.get('browser'), Mojo.Event.webViewLoadStopped, this.loadStopped.bind(this));
        Mojo.Event.listen(this.controller.get('browser'), Mojo.Event.webViewLoadFailed, this.loadStopped.bind(this));
        Mojo.Event.listen(this.controller.get('browser'), Mojo.Event.webViewTitleUrlChanged, this.titleChanged.bind(this));
        this.requestToken();
    },
    
    titleChanged: function (event)
    {
        var callbackUrl=event.url;
        var responseVars=callbackUrl.split("?");
        if (!this.exchangingToken && (responseVars[0] == this.callbackURL + '/' || responseVars[0] == this.callbackURL)) {
            this.controller.get('browser').hide();
            var response_param = responseVars[1];
            var result = response_param.match(/oauth_token=*/g);
            if(result != null) {
                var token;
                var params = response_param.split("&");
                params.each(function (item) {
                    if (item.indexOf('oauth_token=') != -1) {
                        token = decodeURIComponent(item.replace("oauth_token=", ""));
                    }
                    else if (item.indexOf('oauth_verifier=') != -1) {
                        this.oauth_verifier = item.replace("oauth_verifier=", "");
                    }
                }, this);
                console.log(this.oauth_verifier);
                this.exchangeToken(token);
            }
        }
    },
    
    signHeader: function (url, method, params, token, tokenSecret)
    {
        if (!params) params = '';
        if (!method) method = 'GET';
        if (!tokenSecret) tokenSecret = '';
        var timestamp = OAuth.timestamp();
        var nonce = OAuth.nonce(11);
        var accessor = {consumerSecret: this.consumer_key_secret, tokenSecret : tokenSecret};
        var message = {method: method, action: url, parameters: OAuth.decodeForm(params)};
        message.parameters.push(['oauth_consumer_key', this.consumer_key]);
        message.parameters.push(['oauth_nonce', nonce]);
        message.parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
        message.parameters.push(['oauth_timestamp', timestamp]);
        if (token) {
            message.parameters.push(['oauth_token', token]);
        }
        message.parameters.push(['oauth_version','1.0']);
        message.parameters.sort();
        OAuth.SignatureMethod.sign(message, accessor);
        return OAuth.getAuthorizationHeader("", message.parameters);
    },
    
    requestToken: function ()
    {
        new Ajax.Request(this.requestTokenUrl, {
            method: this.requestTokenMethod,
            encoding: 'UTF-8',
            requestHeaders: {
                'Authorization': this.signHeader(this.requestTokenUrl, this.requestTokenMethod, "oauth_callback=" + this.callback + "&scope=" + encodeURIComponent(this.authScope) + "&xoauth_displayname=" + encodeURIComponent(this.displayName))
            },
            onComplete: function(response) {
                var responseVars = response.responseText.split("&");
                console.log(Object.toJSON(responseVars));
                var oauth_token = '';
                responseVars.each(function (item) {
                    if (item.indexOf('oauth_token=') != -1) {
                        oauth_token = decodeURIComponent(item.replace("oauth_token=",""));
                    }
                    else if (item.indexOf('oauth_token_secret=') != -1) {
                        this.tokenSecret = decodeURIComponent(item.replace("oauth_token_secret=", ""));
                    }
                }, this);
                
                this.instanceBrowser({
                    authUrl: this.authorizeUrl + "?oauth_token=" + oauth_token + "&btmpl=mobile",
                    callbackUrl: this.callback
                });
            }.bind(this)
        });
    },
    
    exchangeToken: function (token)
    {
        this.exchangingToken = true;
        new Ajax.Request(this.accessTokenUrl, {
            method: this.accessTokenMethod,
            encoding: 'UTF-8',
            requestHeaders: {
                'Authorization': this.signHeader(this.accessTokenUrl, this.accessTokenMethod, "oauth_verifier=" + this.oauth_verifier, token, this.tokenSecret)
            },
            onComplete: function(response) {
                var response_text = response.responseText;
                this.controller.stageController.swapScene({
                    assistantConstructor: Analytics.Scene.Settings,
                    name: 'settings',
                    transition: Mojo.Transition.none
                },{
                    source: 'oauth',
                    accountId: this.accountId,
                    response: response_text
                });
            }.bind(this)
        });
    },
    
    instanceBrowser: function (oauthBrowserParams)
    {
        this.storyURL = oauthBrowserParams.authUrl;
        this.callbackURL=oauthBrowserParams.callbackUrl;
        this.controller.get('browser').mojo.openURL(oauthBrowserParams.authUrl);
    },
    
    handleCommand: function (event)
    {
        if (event.type == Mojo.Event.command) {
            switch (event.command) {
                case 'refresh':
                this.controller.get('browser').mojo.reloadPage();
                break;
                case 'stop':
                this.controller.get('browser').mojo.stopLoad();
                break;
            }
        }
    },
    
    //  loadStarted - switch command button to stop icon & command
    loadStarted: function (event)
    {
        this.cmdMenuModel.items.pop(this.reloadModel);
        this.cmdMenuModel.items.push(this.stopModel);
        this.controller.modelChanged(this.cmdMenuModel);
        this.currLoadProgressImage = 0;
    },
    
    //  loadStopped - switch command button to reload icon & command
    loadStopped: function (event)
    {
        this.cmdMenuModel.items.pop(this.stopModel);
        this.cmdMenuModel.items.push(this.reloadModel);
        this.controller.modelChanged(this.cmdMenuModel);
    },
    
    //  loadProgress - check for completion, then update progress
    loadProgress: function (event)
    {
        var percent = event.progress;
        try {
            if (percent > 100) {
                percent = 100;
            }
            else if (percent < 0) {
                percent = 0;
            }
            // Update the percentage complete
            this.currLoadProgressPercentage = percent;
            // Convert the percentage complete to an image number
            // Image must be from 0 to 23 (24 images available)
            var image = Math.round(percent / 4.1);
            if (image > 23) {
                image = 23;
            }
            // Ignore this update if the percentage is lower than where we're showing
            if (image < this.currLoadProgressImage) {
                return;
            }
            // Has the progress changed?
            if (this.currLoadProgressImage != image) {
                // Cancel the existing animator if there is one
                if (this.loadProgressAnimator) {
                    this.loadProgressAnimator.cancel();
                    delete this.loadProgressAnimator;
                }
                // Animate from the current value to the new value
                var icon = this.controller.select('div.load-progress')[0];
                if (icon) {
                    this.loadProgressAnimator = Mojo.Animation.animateValue(Mojo.Animation.queueForElement(icon),
                        "linear", this._updateLoadProgress.bind(this), {
                            from: this.currLoadProgressImage,
                            to: image,
                            duration: 0.5
                    });
                }
            }
        }
        catch (e) {
            Mojo.Log.logException(e, e.description);
        }
    },
    
    _updateLoadProgress: function (image)
    {
        // Find the progress image
        image = Math.round(image);
        // Don't do anything if the progress is already displayed
        if (this.currLoadProgressImage == image) {
            return;
        }
        var icon = this.controller.select('div.load-progress');
        if (icon && icon[0]) {
            icon[0].setStyle({'background-position': "0px -" + (image * 48) + "px"});
        }
        this.currLoadProgressImage = image;
    },
    
    activate: function (event) {},
    
    deactivate: function (event) {},
    
    cleanup: function (event)
    {
        console.log('cleanup');
        this.oauth_verifier = null;
        Mojo.Event.stopListening(this.controller.get('browser'),Mojo.Event.webViewLoadProgress, this.loadProgress);
        Mojo.Event.stopListening(this.controller.get('browser'),Mojo.Event.webViewLoadStarted, this.loadStarted);
        Mojo.Event.stopListening(this.controller.get('browser'),Mojo.Event.webViewLoadStopped, this.loadStopped);
        Mojo.Event.stopListening(this.controller.get('browser'),Mojo.Event.webViewLoadFailed, this.loadStopped);
        Mojo.Event.stopListening(this.controller.get('browser'),Mojo.Event.webViewTitleUrlChanged, this.titleChanged);
    }
});
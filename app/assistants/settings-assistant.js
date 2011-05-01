/**
 *
 *  TODO:
 *      - Error-Handling
 *
 **/
Analytics.Scene.Settings = Class.create(Analytics.Util.Base, {
    initialize : function ($super, args)
    {
        $super(args);
        
        this.tapHandler = this.handleTap.bindAsEventListener(this);
        this.addHandler = this.handleAdd.bindAsEventListener(this);
        this.accountsHandler = this.handleAccounts.bindAsEventListener(this);
        this.removeHandler = this.handleRemove.bindAsEventListener(this);
        this.settings = Analytics.Util.Settings.getInstance();
        this.api = Analytics.Model.Api.getInstance();
        this.accounts = Analytics.Model.Accounts.getInstance();
        this.profiles = Analytics.Model.Profiles.getInstance();
    },
    
    setup : function ($super)
    {
        $super();
        this.accountModel = {
            listTitle: $L('Google accounts'),
            items : []
        };
        this.accountAttr = {
            listTemplate: 'settings/list-container', 
            itemTemplate: 'settings/list-item',
            addItemLabel: $L("Add a google account ..."),
            swipeToDelete: true,
            autoconfirmDelete: false,
            deletedProperty: 'swiped'
        };
        this.controller.setupWidget('accountList', this.accountAttr, this.accountModel);
        this.controller.listen('accountList', Mojo.Event.listTap, this.tapHandler);
        this.controller.listen('accountList', Mojo.Event.listAdd, this.addHandler);
        this.controller.listen('accountList', Mojo.Event.listDelete, this.removeHandler);
        
        this.controller.setupWidget('save-spinner', {spinnerSize: "large"}, {spinning: true});
        this.scrim = Mojo.View.createScrim(this.controller.document, {scrimClass: 'palm-scrim'});
        this.controller.get('save-scrim').appendChild(this.scrim).appendChild(this.controller.get('save-spinner'));
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        if (!this.settings.get("global").updateMsg) {
            this.controller.showAlertDialog({
                title: $L("Update information"),
                message: $L("In Version 0.9.2 the authentication machanism has changed to OAuth. Because of this you have to re-enter your account(s). We apologise for any inconvenience."),
                choices:[
                    {label:$L("Ok"), value:"ok"}
                ]
            });
            this.settings.set("global", {updateMsg : true});
        }
        this.controller.get('settings-title').update($L('Preferences & Accounts'));
        if (this.params.source && this.params.source == 'oauth' && this.params.accountId && this.params.response) {
            this.showSpinner();
            var response = this.params.response;
            var responseVars = response.split("&");
            if (response.indexOf('oauth_token') != -1 && responseVars.length == 2) {
                var oauth_token = '';
                var oauth_secret = '';
                responseVars.each(function (item) {
                    if (item.indexOf('oauth_token=') != -1) {
                        oauth_token = decodeURIComponent(item.replace("oauth_token=",""));
                    }
                    else {
                        oauth_secret = decodeURIComponent(item.replace("oauth_token_secret=",""));
                    }
                });
                this.accounts.modify({
                    id: this.params.accountId,
                    oauth_token: oauth_token,
                    oauth_secret: oauth_secret,
                    onSuccess: this.handleOAuthSuccess.bind(this)
                });
            }
            else {
                this.hideSpinner();
                this.showAlert($L('The authorisation of your account went wrong, please try again by tapping on the account name.'), 'error', 5000, 3);
                this.refreshList();
            }
            this.params.accountId = null;
        }
        
        if (!this.params.source) {
            this.hideSpinner();
            if (Analytics.Util.Settings.getInstance().get("global") && Analytics.Util.Settings.getInstance().get("global").accountsDbCreated && Analytics.Util.Settings.getInstance().get("global").accountsDbVersion) {
                this.refreshList();
            }
        }
        
        $super();
    },
    
    deactivate : function ($super)
    {
        $super();
    },
    
    cleanup : function ($super)
    {
        this.controller.stopListening('accountList', Mojo.Event.listTap, this.tapHandler);
        this.controller.stopListening('accountList', Mojo.Event.listAdd, this.addHandler);
        this.controller.stopListening('accountList', Mojo.Event.listDelete, this.removeHandler);
        
        this.tapHandler = null;
        this.addHandler = null;
        this.removeHandler = null;
        this.accountsHandler = null;
        
        this.accountModel = null;
        this.accountAttr = null;
        
        this.settings = null;
        this.accounts = null;
        
        $super();
    },
    
    authoriseAccount : function (accountId)
    {
        var oauthConfig={
            callbackScene: 'settings',
            accountId: accountId,
            requestTokenUrl: this.api.requestTokenUrl,
            requestTokenMethod: this.api.requestTokenMethod,
            authorizeUrl: this.api.authorizeUrl,
            accessTokenUrl: this.api.accessTokenUrl,
            accessTokenMethod: this.api.accessTokenMethod,
            authScope: this.api.authScope,
            consumer_key: this.api.consumer_key,
            consumer_key_secret: this.api.consumer_key_secret,
            callback: 'http://slansky.net/analytics',
            displayName: 'Analytics for webOS'
        };
        this.showScene("oauth", oauthConfig);
    },
    
    refreshList : function ()
    {
        this.hideSpinner();
        this.accounts.getAll({
            onSuccess: this.accountsHandler
        });
    },
    
    handleOAuthSuccess: function (accountId)
    {
        this.settings.set("global", {firstSetup : true});
        this.api.getAccountInfo({
            id: accountId,
            onSuccess: this.refreshList.bind(this)
        });
    },
    
    handleCommand : function($super, event)
    {
        $super(event);
    },
    
    handleAccounts : function (results)
    {
        if (results.length > 0)
        {
            this.accountModel.items = results;
            this.controller.modelChanged(this.accountModel);
        }
    },
    
    handleTap : function (evt)
    {
        if (!evt.item.oauth_token || !evt.item.oauth_secret) {
            this.authoriseAccount(evt.item.id);
        }
        else {
            this.showScene("settings-account", evt.item);
        }
    },
    
    handleAdd : function (evt)
    {
        this.controller.showDialog({
            template: 'settings/account-dialog',
            assistant: new Analytics.Scene.AccountDialog(this)
        });
    },
    
    handleRemove : function (evt)
    {
        this.profiles.del({
            limiters : [
                {'column' : 'accountId', 'operand' : '=', 'value' : evt.item.id}
            ]
        });
        this.accounts.del({
            limiters : [
                {'column' : 'id', 'operand' : '=', 'value' : evt.item.id}
            ]
        });
    },
    
    showSpinner : function ()
    {
        this.controller.get('save-spinner').mojo.start();
        this.scrim.show();
    },
    
    hideSpinner : function ()
    {
        this.controller.get('save-spinner').mojo.stop();
        this.scrim.hide();
    }
    
});

Analytics.Scene.AccountDialog = Class.create({
    
    initialize: function(sceneAssistant)
    {
        this.sceneAssistant = sceneAssistant;
        this.controller = sceneAssistant.controller;
        this.accounts = Analytics.Model.Accounts.getInstance();
        this.settings = Analytics.Util.Settings.getInstance();
        
        this.saveHandler = this.handleSave.bindAsEventListener(this);
        this.cancelHandler = this.handleCancel.bindAsEventListener(this);
        
        console.log(Object.toJSON(this.sceneAssistant.item));
        if (this.sceneAssistant.item) {
            this.edit = true;
        }
    },
    
    setup : function(widget)
    {
        this.widget = widget;
        
        this.controller.setupWidget('save_button', {}, {
            label : $L('Done'),
            type : 'Mojo.Widget.activityButton',
            disabled: false
        });
        
        this.controller.setupWidget('cancel_button', {}, {
            label : $L('Cancel'),
            disabled: false
        });
        this.controller.listen('save_button', Mojo.Event.tap, this.saveHandler);
        this.controller.listen('cancel_button', Mojo.Event.tap, this.cancelHandler);
        
        this.nameModel = {};
        if (this.edit) {
            this.nameModel.value = this.sceneAssistant.item.name;
        }
        this.controller.setupWidget('name',
            {
                maxLength: 64,
                focus: true,
                hintText: $L('Account Name')
            },
            this.nameModel
        );
    },
    
    activate : function ()
    {
        this.controller.get('dialog-title').update($L('Enter an account name'));
    },
    
    handleSave : function ()
    {
        if (this.nameModel.value) {
            var params = {
                name: this.nameModel.value,
                onSuccess: this.handleSuccess.bind(this)
            };
            if (this.edit) {
                params.id = this.sceneAssistant.item.id;
            }
            this.accounts.modify(params);
        }
        else {
            this.sceneAssistant.showAlert($L('Enter an account name. The name is only a desciptive name for you.'), 'error', 5000, 3);
        }
    },
    
    handleSuccess : function (accountId)
    {
        if (!this.edit && this.sceneAssistant) {
            this.sceneAssistant.authoriseAccount(accountId);
        }
        if (this.widget) {
            this.widget.mojo.close();
        }
    },
    
    handleAccountInfo : function ()
    {
        if (this.sceneAssistant) {
            this.hideSpinner();
            this.sceneAssistant.refreshList();
        }
        if (this.widget) {
            this.widget.mojo.close();
        }
    },
    
    handleCancel : function ()
    {
        this.widget.mojo.close();
    },
    
    deactivate : function ()
    {
        this.controller.stopListening('save_button', Mojo.Event.tap, this.saveHandler);
        this.controller.stopListening('cancel_button', Mojo.Event.tap, this.cancelHandler);
        
        this.sceneAssistant = null;
        this.controller = null;
        this.saveHandler = null;
        this.cancelHandler = null;
        this.widget = null;
        this.api = null;
        this.settings = null;
        this.edit = null;
    }
});
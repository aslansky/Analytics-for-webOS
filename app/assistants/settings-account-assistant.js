Analytics.Scene.SettingsAccount = Class.create(Analytics.Util.Base, {
    initialize : function ($super, args)
    {
        $super(args);
        this.item = args;
        
        this.profilesHandler = this.handleProfiles.bindAsEventListener(this);
        this.editHandler = this.handleEdit.bindAsEventListener(this);
        this.rfHandler = this.handleRf.bindAsEventListener(this);
        this.toggleHandler = this.handleToggle.bind(this);
        
        this.api = Analytics.Model.Api.getInstance();
        this.profiles = Analytics.Model.Profiles.getInstance();
        this.accounts = Analytics.Model.Accounts.getInstance();
    },
    
    setup : function ($super)
    {
        $super();
        this.profileModel = {
            listTitle: $L('Websites'),
            items : []
        };
        this.profileAttr = {
            listTemplate: 'settings-account/list-container', 
            itemTemplate: 'settings-account/list-item',
            swipeToDelete: false
        };
        this.controller.setupWidget('profileList', this.profileAttr, this.profileModel);
        
        this.controller.setupWidget('activity-toggle', {
            modelProperty: 'active',
            trueValue: 1,
            falseValue: 0,
            unstyled: true,
            inputName: 'active'
        });
        this.controller.listen('profileList', Mojo.Event.propertyChange, this.toggleHandler);
        
        this.controller.setupWidget('edit_button', {}, {
            label : $L('Edit account'),
            disabled: false
        });
        this.controller.listen('edit_button', Mojo.Event.tap, this.editHandler);
        
        this.controller.setupWidget('refresh_button', {}, {
            label : $L('Refresh websites'),
            disabled: false
        });
        this.controller.listen('refresh_button', Mojo.Event.tap, this.rfHandler);
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        this.controller.get('settings-title').update($L('Preferences & Accounts'));
        console.log(this.item.profiles);
        if (!this.item.profiles || this.item.profiles == 0) {
            this.api.getAccountInfo({
                id: this.item.id,
                onSuccess: this.handleAccountInfo.bind(this)
            });
        }
        else {
            this.refreshList();
        }
        $super();
    },
    
    deactivate : function ($super)
    {
        $super();
    },
    
    cleanup : function ($super)
    {
        this.controller.stopListening('edit_button', Mojo.Event.tap, this.editHandler);
        //this.controller.stopListening('activity-toggle', Mojo.Event.propertyChange, this.toggleHandler);
        
        this.profilesHandler = null;
        this.editHandler = null;
        this.toggleHandler = null;

        this.profileAttr = null;
        this.profileModel = null;
        
        this.profiles = null;
        this.item = null;
        $super();
    },
    
    refreshList : function ()
    {
        this.profiles.getAll({
            filter: [{
                'column' : 'accountId',
                'operand' : '=',
                'value' : this.item.id
            }],
            onSuccess: this.profilesHandler
        });
    },
    
    handleAccountInfo : function (result)
    {
        console.log('handleAccountInfo');
        this.refreshList();
    },
    
    handleCommand : function ($super, event)
    {
        $super(event);
    },
    
    handleProfiles : function (results)
    {
        if (results.length > 0)
        {
            this.profileModel.items = results;
            this.controller.modelChanged(this.profileModel);
        }
    },
    
    handleEdit : function (evt)
    {
        this.controller.showDialog({
            template: 'settings/account-dialog',
            assistant: new Analytics.Scene.AccountDialog(this)
        });
    },
    
    handleRf : function ()
    {
        this.profiles.del({
            limiters : [
                {'column' : 'accountId', 'operand' : '=', 'value' : this.item.id}
            ],
            onSuccess: this.onDelAll.bind(this)
        });
    },
    
    onDelAll: function ()
    {
        this.api.getAccountInfo({
            id: this.item.id,
            onSuccess: this.handleAccountInfo.bind(this)
        });
    },
    
    handleToggle : function (evt)
    {
        var m = {};
        m.id = evt.model.id;
        m.active = (evt.model.active == 1) ? 0 : 1;
        m.onSuccess = this.handleToggleSave.bind(this);
        this.profiles.modify(m);
    },
    
    handleToggleSave : function (evt)
    {
        this.refreshList();
    }
    
});
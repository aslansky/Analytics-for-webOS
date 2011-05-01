Analytics.Scene.Dashboard = Class.create(Analytics.Util.Period, {
    
    initialize : function ($super, args)
    {
        $super(args);
        
        this.doRefresh = true;
        this.accounts = Analytics.Model.Accounts.getInstance();
        this.profiles = Analytics.Model.Profiles.getInstance();
        
        this.refreshHandler = this.handleRefresh.bindAsEventListener(this);
        this.listTapHandler = this.handleListTap.bindAsEventListener(this);
        
        this.reorder = this.onReorder.bindAsEventListener(this);
        this.renderer = this.onItemRendered.bind(this);
    },
    
    setup : function ($super)
    {
        $super();
        
        this.dashModel = {
            items : []
        };
        this.dashAttr = {
            listTemplate: 'dashboard/list-container', 
            itemTemplate: 'dashboard/list-item',
            onItemRendered: this.renderer,
            reorderable: true,
            swipeToDelete: false
        };
        this.controller.setupWidget('dashList', this.dashAttr, this.dashModel);
        this.controller.listen('dashList', Mojo.Event.listReorder, this.reorder);
        this.controller.listen('dashList', Mojo.Event.listTap, this.listTapHandler);
        this.controller.setupWidget('activity-spinner',
            { spinnerSize: 'large' },
            { spinning: true }
        );
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        if (!this.settings.get("global").updateMsg) {
            this.showScene('settings');
        }
        else {
            if (this.settings.get("global") && this.settings.get("global").period) {
                if (this.period != this.settings.get("global").period.period) {
                    this.doRefresh = true;
                }
                this.period = this.settings.get("global").period.period;
                this.startDate = this.settings.get("global").period.startDate;
                this.endDate = this.settings.get("global").period.endDate;
            }
            this.refresh();
        }
        $super();
    },
    
    deactivate : function ($super)
    {
        $super();
    },
    
    cleanup : function ($super)
    {
        this.controller.stopListening('dashList', Mojo.Event.listReorder, this.reorder);
        this.controller.stopListening('dashList', Mojo.Event.listTap, this.listTapHandler);
        
        this.doRefresh = null;
        this.accounts = null;
        this.profiles = null;
        this.api = null;
        this.store = null;
        
        this.refreshHandler = null;
        this.listTapHandler = null;
        
        this.dashModel = null;
        this.dashAttr = null;
        
        this.reorder = null;
        this.renderer = null;
        
        $super();
    },
    
    refresh : function ()
    {
        this.profiles.getAll({
            filter: [{
                'column' : 'active',
                'operand' : '=',
                'value' : 1
            }],
            order: 'sort ASC',
            onSuccess: this.refreshHandler
        });
    },
    
    onReorder : function (evt) {
        var items = evt.model.items;
        items.splice(evt.fromIndex, 1);
        items.splice(evt.toIndex, 0, evt.item);
        items.each(function (item, index) {
            this.profiles.modify({
                id: item.id,
                sort: index
            });
        }, this);
    },
    
    onItemRendered : function (widget, model, node)
    {
        node.select('.spinner')[0].mojo.start();
        node.select('.content')[0].setStyle({opacity: 0.2});
        this.updateHeader(this.period);
        if (this.store.isValid(model.id, 'base', this.period, this.startDate, this.endDate) && !this.doRefresh) {
            this.onItemData(widget, model, node, this.store.get(model.id, 'base'), this.startDate, this.endDate, true);
        }
        else {
            this.profiles.getDetailsById({
                id: model.id,
                onSuccess: this.onProfileData.bind(this, widget, model, node),
                onError: this.onProfileDataError.bind(this, widget, model, node)
            });
        }
    },
    
    onProfileData : function (widget, model, node, profile)
    {
        this.store.set(profile.id, 'oauth_token', profile.oauth_token);
        this.store.set(profile.id, 'oauth_secret', profile.oauth_secret);
        this.store.set(profile.id, 'period', this.period);
        this.store.set(profile.id, 'startDate', this.startDate);
        this.store.set(profile.id, 'endDate', this.endDate);
        this.api.getData({
            oauth_token: profile.oauth_token,
            oauth_secret: profile.oauth_secret,
            profileId: profile.profileId,
            metrics: 'ga:visits,ga:bounces,ga:pageviews',
            period: this.period,
            dateFrom: this.startDate,
            dateTo: this.endDate,
            onSuccess: this.onItemData.bind(this, widget, model, node),
            onError: this.onProfileDataError.bind(this, widget, model, node)
        });
    },
    
    onProfileDataError : function (widget, model, node, error)
    {
        console.log(Object.toJSON(error));
        node.select('.spinner')[0].mojo.stop();
        node.select('.content')[0].setStyle({opacity: 1});
        this.showAlert($L('An error occured while getting data from google. Message: ') + error.info, 'error', 10000, 5);
    },
    
    onItemData : function (widget, model, node, result, startDate, endDate, cached)
    {
        if (!cached) {
            this.store.set(model.id, 'base', result);
        }
        node.select('.visits .amount')[0].update(this.numberIntWord(Number(result["ga:visits"])));
        var percent = (Number(result["ga:bounces"]) > 0 && Number(result["ga:visits"]) > 0) ? (Number(result["ga:bounces"]) / Number(result["ga:visits"])) * 100 : 0;
        node.select('.bounce .amount')[0].update(Mojo.Format.formatPercent(percent));
        node.select('.pageview .amount')[0].update(this.numberIntWord(Number(result["ga:pageviews"])));
        node.select('.spinner')[0].mojo.stop();
        node.select('.content')[0].setStyle({opacity: 1});
        if (startDate && endDate) {
            this.setTitle(startDate, endDate);
            this.startDate = startDate; 
            this.endDate = endDate;
            this.store.set(model.id, 'startDate', startDate);
            this.store.set(model.id, 'endDate', endDate);
        }
    },
    
    handleCommand : function($super, event)
    {
        $super(event);
    },
    
    handleRefresh : function (results)
    {
        if (results.length > 0 && this.settings.get("global").accountsDbVersion)
        {
            results.each(function(item, index) {
                results[index].translation = Analytics.Util.ListTranslation;
            });
            this.dashModel.items = results;
            this.controller.modelChanged(this.dashModel);
        }
        else {
            this.showScene('settings');
        }
        this.doRefresh = false;
    },
    
    handleListTap : function (evt)
    {
        this.showScene('overview', {item : evt.item, period: this.period, startDate: this.startDate, endDate: this.endDate});
    },
    
    numberIntWord : function (value)
    {
        value = Number(value);
        if (value < 1000000) {
            return Mojo.Format.formatNumber(value, {fractionDigits: 0});
        }
        else if (value < 1000000000) {
            new_value = value / 1000000;
            return Mojo.Format.formatNumber(new_value, {fractionDigits: 2}) + $L('M');
        }
        else if (value < 1000000000000) {
            new_value = value / 1000000000;
            return Mojo.Format.formatNumber(new_value, {fractionDigits: 2}) + $L('bn');
        }
        else {
            return Mojo.Format.formatNumber(value, {fractionDigits: 2});
        }
    }
    
});
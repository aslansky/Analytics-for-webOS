Analytics.Util.Period = Class.create(Analytics.Util.Base, {
    
    initialize : function($super, params) {
        $super(params);
        
        this.settings = Analytics.Util.Settings.getInstance();
        this.api = Analytics.Model.Api.getInstance();
        this.store = Analytics.Util.DataStore.getInstance();
        
        this.choosePeriod = this.periodChoose.bind(this);
        this.periodTapHandler = this.handlePeriodTap.bindAsEventListener(this);
        this.period = 'month';
        this.startDate = null;
        this.endDate = null;
    },
    
    setup : function ($super)
    {
        $super();
        var items = [];
        items[0] = {};
        if (this.categoryMenuModel) {
            items[0] = {
                items: [
                    {iconPath: 'images/icon-home.png', label: $L('Dashboard'), command: 'dashboard'},
                    {iconPath: 'images/icon-more.png', label: $L('More'), submenu:'category-menu'}
                ]
            };
        }
        items[1] = {};
        items[2] = {
            items: [
                { iconPath: 'images/icon-refresh.png', command: 'do-refresh' }
            ]
        };
        this.controller.setupWidget(
            Mojo.Menu.commandMenu,
            this.cMenuAttributes = {
                spacerHeight: 0,
                menuClass: 'blue-command-not'
            },
            this.cMenuModel = {
                visible: true,
                items: items
            }
        );
        if (this.categoryMenuModel) {
            this.controller.setupWidget('category-menu', undefined, this.categoryMenuModel);
        }
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        this.updateHeader(this.period);
        this.controller.get('period_source').observe(Mojo.Event.tap, this.periodTapHandler);
        $super();
    },
    
    deactivate : function ($super)
    {
        $super();
    },
    
    cleanup : function ($super)
    {
        this.controller.get('period_source').stopObserving(Mojo.Event.tap, this.periodTapHandler);
        
        this.settings = null;
        this.api = null;
        this.store = null;
        
        this.choosePeriod = null;
        this.periodTapHandler = null;
        this.period = null;
        this.startDate = null;
        this.endDate = null;
        
        $super();
    },
    
    setTitle : function (startDate, endDate)
    {
        var sd = Date.parseFormat(startDate, 'YYYY-MM-DD');
        var ed = Date.parseFormat(endDate, 'YYYY-MM-DD');
        this.controller.get('title').update(Mojo.Format.formatDate(sd, {date: 'short'}) + ' - ' + Mojo.Format.formatDate(ed, {date: 'short'}));
    },
    
    updateHeader : function (period)
    {
        this.controller.get('current_period').update($L(period.substr(0, 1).toUpperCase() + period.substr(1)));
        this.controller.get('period_source').setAttribute('class', 'header-period-source');
    },
    
    handlePeriodTap : function (evt)
    {
        evt.stop();
        this.controller.popupSubmenu(
        {
            onChoose: this.choosePeriod,
            toggleCmd: this.period,
            manualPlacement: true,
            popupClass: "cal-selector-popup",
            items: [
                {label: $L('Day'), command: 'day'},
                {label: $L('Week'), command: 'week'},
                {label: $L('Month'), command: 'month'},
                {label: $L('Year'), command: 'year'},
                {label: $L('Custom'), command: 'custom'}
            ]
        });
    },
    
    periodChoose : function (value)
    {
        if (value) {
            if (value == 'custom') {
                var dates = this.api.getPeriodDates(this.period, this.startDate, this.endDate);
                this.controller.showDialog({
                    template: 'date-dialog',
                    assistant: new Analytics.Scene.DateDialog(this, dates[0], dates[1])
                });
            }
            else {
                this.settings.set("global", {period : {
                    period: value,
                    startDate: null,
                    endDate: null
                }});
                this.period = value;
                this.updateHeader(this.period);
                this.doRefresh = true;
                this.store.invalidate();
                this.refresh();
            }
        }
    },
    
    handleCommand : function($super, event)
    {
        if(event.type == Mojo.Event.command)
        {
            switch(event.command) {
                case 'do-refresh':
                    this.doRefresh = true;
                    this.refresh();
                    break;
                case 'dashboard':
                    this.showScene('dashboard');
                    break;
            }
        }
        $super(event);
    },
    
    refresh : function () 
    {
        
    }
});

Analytics.Scene.DateDialog = Class.create({
    
    initialize: function(sceneAssistant, startDate, endDate, oldPeriod)
    {
        this.sceneAssistant = sceneAssistant;
        this.controller = sceneAssistant.controller;
        
        this.settings = Analytics.Util.Settings.getInstance();
        this.store = Analytics.Util.DataStore.getInstance();
        
        this.okHandler = this.handleOk.bindAsEventListener(this);
        this.cancelHandler = this.handleCancel.bindAsEventListener(this);
        
        this.startDate = startDate;
        this.endDate = endDate;
    },
    
    setup : function(widget)
    {
        this.widget = widget;
        
        this.controller.setupWidget('ok_button', {}, {
            label : $L('Done'),
            disabled: false
        });
        
        this.controller.setupWidget('cancel_button', {}, {
            label : $L('Cancel'),
            disabled: false
        });
        this.controller.listen('ok_button', Mojo.Event.tap, this.okHandler);
        this.controller.listen('cancel_button', Mojo.Event.tap, this.cancelHandler);
        
        this.controller.setupWidget("dateFrom",
            this.fromAttr = {},
            this.fromModel = {
                date: Date.parseFormat(this.startDate, 'YYYY-MM-DD')
            }
        );
        
        this.controller.setupWidget("dateTo",
            this.toAttr = {},
            this.toModel = {
                date: Date.parseFormat(this.endDate, 'YYYY-MM-DD')
            }
        );
    },
    
    deactivate : function ()
    {
        this.controller.stopListening('ok_button', Mojo.Event.tap, this.okHandler);
        this.controller.stopListening('cancel_button', Mojo.Event.tap, this.cancelHandler);
        
        this.sceneAssistant = null;
        this.controller = null;
        this.widget = null;
        
        this.settings = null;
        this.store = null;
        this.startDate = null;
        this.endDate = null;
        
        this.fromAttr = null;
        this.fromModel = null;
        this.toAttr = null;
        this.toModel = null;
        
        this.okHandler = null;
        this.cancelHandler = null;
    },
    
    handleCancel : function ()
    {
        this.widget.mojo.close();
    },
    
    handleOk : function ()
    {
        if (this.fromModel.date.compare(this.toModel.date) == -1) {
            this.settings.set("global", {period : {
                period: 'custom',
                startDate: this.fromModel.date.dateFormat("YYYY-MM-DD"),
                endDate: this.toModel.date.dateFormat("YYYY-MM-DD")
            }});
            this.sceneAssistant.period = 'custom';
            this.sceneAssistant.startDate = this.fromModel.date.dateFormat("YYYY-MM-DD");
            this.sceneAssistant.endDate = this.toModel.date.dateFormat("YYYY-MM-DD");
            this.sceneAssistant.doRefresh = true;
            this.sceneAssistant.updateHeader('custom');
            this.store.invalidate();
            this.sceneAssistant.refresh();
            this.widget.mojo.close();
        }
        else {
            this.sceneAssistant.showAlert($L('Start date has to be smaller then to date.'), 'error', 5000, 2);
        }
    }
});
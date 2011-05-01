Analytics.Scene.EventAction = Class.create(Analytics.Util.Details, {
    
    initialize : function ($super, args)
    {
        $super(args);
        
        this.dataHandler = this.handleData.bind(this);
        this.chartHandler = this.handleChartData.bind(this);
        this.errorHandler = this.handleError.bind(this);
        this.filterHandle = this.handleFilter.bind(this);
        this.filterChangeHandle = this.handleFilterChange.bind(this);
        this.tapHandle = this.handleTap.bind(this);
        this.items = [];
        this.category = args.category;
    },
    
    setup : function ($super)
    {
        $super();
        this.controller.setupWidget(
            'event-action-list',
            {
                itemTemplate: 'event-action/data-item',
                emptyTemplate: 'empty-item',
                swipeToDelete: false,
                reorderable: false,
                renderLimit: 50,
                filterFunction: this.filterHandle
            }
        );
        Mojo.Event.listen(this.controller.get('event-action-list'), Mojo.Event.listTap,  this.tapHandle);
        Mojo.Event.listen(this.controller.get('event-action-list'), Mojo.Event.filterImmediate,  this.filterChangeHandle);
        
        this.spacerDiv = this.controller.get('empty_spacer');
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        this.items = [];
        this.controller.get('event-action-title').update(this.item.title + ' / ' + $L('Events') + ' / ' + this.category);
        $super();
    },
    
    deactivate : function ($super)
    {
        $super();
    },
    
    cleanup : function ($super)
    {
        this.items = null;
        this.category = null;
        
        this.handleFilter = null;
        this.dataHandler = null;
        this.errorHandler = null;
        this.chartHandler = null;
        
        this.spacerDiv = null;
        
        $super();
    },
    
    refresh : function ()
    {
        this.store.invalidate(this.item.id, 'eventActions');
        this.store.invalidate(this.item.id, 'eventActionsChart');
        this.items = [];
        this.showSpinner();
        this.getData();
    },
    
    getData : function ()
    {
        if (this.store.isValid(this.item.id, 'eventActions', this.period, this.startDate, this.endDate)) {
            this.getChartData();
        }
        else {
            if (!this.store.get(this.item.id, 'oauth_token')) {
                this.getAuth();
            }
            else {
                this.api.getData({
                    oauth_token: this.store.get(this.item.id, 'oauth_token'),
                    oauth_secret: this.store.get(this.item.id, 'oauth_secret'),
                    profileId: this.item.profileId,
                    metrics: 'ga:totalEvents,ga:uniqueEvents,ga:eventValue',
                    dimensions: 'ga:eventAction',
                    sort: '-ga:totalEvents',
                    filters: 'ga:eventCategory==' + this.category,
                    period: this.period,
                    dateFrom: this.startDate,
                    dateTo: this.endDate,
                    onSuccess: this.dataHandler,
                    onError: this.errorHandler
                });
            }
        }
    },
    
    getChartData : function ()
    {
        if (this.store.isValid(this.item.id, 'eventActionsChart', this.period, this.startDate, this.endDate)) {
            this.render();
        }
        else {
            var dimension = 'ga:date';
            if (this.period == 'day') {
                dimension = 'ga:hour';
            }
            this.api.getData({
                oauth_token: this.store.get(this.item.id, 'oauth_token'),
                oauth_secret: this.store.get(this.item.id, 'oauth_secret'),
                profileId: this.item.profileId,
                metrics: 'ga:totalEvents',
                dimensions: dimension,
                filters: 'ga:eventCategory==' + this.category,
                period: this.period,
                dateFrom: this.startDate,
                dateTo: this.endDate,
                onSuccess: this.chartHandler,
                onError: this.errorHandler
            });
        }
    },
    
    handleData : function (result, startDate, endDate)
    {
        this.store.set(this.item.id, 'period', this.period);
        this.store.set(this.item.id, 'startDate', startDate);
        this.store.set(this.item.id, 'endDate', endDate);
        if (startDate && endDate) {
            this.setTitle(startDate, endDate);
            this.startDate = startDate;
            this.endDate = endDate;
        }
        this.store.set(this.item.id, 'eventActions', result);
        this.getChartData();
    },
    
    handleChartData : function (result)
    {
        this.store.set(this.item.id, 'eventActionsChart', result);
        this.render();
    },
    
    handleError : function (error)
    {
        console.log(Object.toJSON(error));
    },
    
    handleFilter : function (filterString, listWidget, offset, count)
    {
        var items = [];
        if (filterString.length > 0)
        {
            items = this.items.findAll(function (item) {
                return item.action.toLowerCase().include(filterString.toLowerCase());
            }, this);
        }
        else
        {
            items = this.items;
        }
        
        this.controller.get('event-action-list').mojo.noticeUpdatedItems(0, items);
        this.controller.get('event-action-list').mojo.setLength(items.length);
        this.controller.get('event-action-list').mojo.setCount(items.length);
    },
    
    handleFilterChange : function (evt)
    {
        if (evt.filterString.blank()) {
            this.spacerDiv.show();
        } else {
            this.spacerDiv.hide();
        }
    },
    
    handleTap : function (evt)
    {
        this.showScene('event-label', {action: evt.item.action, item : this.item, period: this.period, startDate: this.startDate, endDate: this.endDate, transition: true});
    },
    
    render : function ()
    {
        this.controller.get('event-action-chart').update();
        
        this.store.get(this.item.id, 'eventActions').each(function (item, index) {
            this.items.push({
                translation: Analytics.Util.ListTranslation,
                action: item['ga:eventAction'],
                totalEvents: Mojo.Format.formatNumber(Number(item['ga:totalEvents'])),
                uniqueEvents: Mojo.Format.formatNumber(Number(item['ga:uniqueEvents'])),
                eventValue: Mojo.Format.formatCurrency(Number(item['ga:eventValue']), {fractionDigits:2})
            });
        }, this);
        
        this.controller.get('event-action-list').mojo.noticeUpdatedItems(0, this.items);
        this.controller.get('event-action-list').mojo.setLength(this.items.length);
        this.controller.get('event-action-list').mojo.setCount(this.items.length);
        
        var obj = this.store.get(this.item.id, 'eventActionsChart');
        var data = [];
        var start;
        var end;
        obj.each(function (item, index) {
            if (index == 0) {
                if (obj == 'day') {
                    start = item['ga:hour'];
                }
                else {
                    start = item['ga:date'];
                }
            }
            if (index == obj.length - 1) {
                if (obj == 'day') {
                    end = item['ga:hour'];
                }
                else {
                    end = item['ga:date'];
                }
            }
            data.push(item['ga:totalEvents']);
        }, this);
        var max = this.max(data);
        var steps = Math.ceil(max / 2);
        if (max > 0) {
            this.controller.get('event-action-chart').parentNode.show();
            var src = 'http://chart.apis.google.com/chart?cht=ls&chs=273x100&chxs=0,969695,12,0,lt,969695&chxt=r&chco=4C91CC&chf=bg,s,E4E5E2&chm=B,C9DCEA,0,0,0|r,7E7F7D,0,0.499,0.501|r,7E7F7D,0,0.998,1.0|r,7E7F7D,0,0.0,0.002&chds=0,' + max + '&chxr=0,0,' + max + ',' + steps + '&chd=t:' + data.join(',');
            this.controller.get('event-action-chart').update('<img src="' + src + '" id="chart-image" />');
        }
        else {
            this.controller.get('event-action-chart').parentNode.hide();
        }
        this.hideSpinner();
    }
    
});
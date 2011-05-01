Analytics.Scene.EventLabel = Class.create(Analytics.Util.Details, {
    
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
        this.action = args.action;
    },
    
    setup : function ($super)
    {
        $super();
        this.controller.setupWidget(
            'event-label-list',
            {
                itemTemplate: 'event-label/data-item',
                emptyTemplate: 'empty-item',
                swipeToDelete: false,
                reorderable: false,
                renderLimit: 50,
                filterFunction: this.filterHandle
            }
        );
        Mojo.Event.listen(this.controller.get('event-label-list'), Mojo.Event.listTap,  this.tapHandle);
        Mojo.Event.listen(this.controller.get('event-label-list'), Mojo.Event.filterImmediate,  this.filterChangeHandle);
        
        this.spacerDiv = this.controller.get('empty_spacer');
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        this.items = [];
        this.controller.get('event-label-title').update(this.item.title + ' / ' + $L('Events') + ' / ' + this.action);
        $super();
    },
    
    deactivate : function ($super)
    {
        $super();
    },
    
    cleanup : function ($super)
    {
        this.items = null;
        this.action = null;
        
        this.handleFilter = null;
        this.dataHandler = null;
        this.errorHandler = null;
        this.chartHandler = null;
        
        this.spacerDiv = null;
        
        $super();
    },
    
    refresh : function ()
    {
        this.store.invalidate(this.item.id, 'eventLabels');
        this.store.invalidate(this.item.id, 'eventLabelsChart');
        this.items = [];
        this.showSpinner();
        this.getData();
    },
    
    getData : function ()
    {
        if (this.store.isValid(this.item.id, 'eventLabels', this.period, this.startDate, this.endDate)) {
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
                    dimensions: 'ga:eventLabel',
                    sort: '-ga:totalEvents',
                    filters: 'ga:eventAction==' + this.action,
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
        if (this.store.isValid(this.item.id, 'eventLabelsChart', this.period, this.startDate, this.endDate)) {
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
                filters: 'ga:eventAction==' + this.action,
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
        this.store.set(this.item.id, 'eventLabels', result);
        this.getChartData();
    },
    
    handleChartData : function (result)
    {
        this.store.set(this.item.id, 'eventLabelsChart', result);
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
                return item.label.toLowerCase().include(filterString.toLowerCase());
            }, this);
        }
        else
        {
            items = this.items;
        }
        
        this.controller.get('event-label-list').mojo.noticeUpdatedItems(0, items);
        this.controller.get('event-label-list').mojo.setLength(items.length);
        this.controller.get('event-label-list').mojo.setCount(items.length);
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
        this.controller.showDialog({
            template : 'dialog',
            assistant : new Analytics.Scene.EventLabelDialog(this, evt.item)
        });
    },
    
    render : function ()
    {
        this.controller.get('event-label-chart').update();
        
        this.store.get(this.item.id, 'eventLabels').each(function (item, index) {
            this.items.push({
                translation: Analytics.Util.ListTranslation,
                label: item['ga:eventLabel'],
                totalEvents: Mojo.Format.formatNumber(Number(item['ga:totalEvents'])),
                uniqueEvents: Mojo.Format.formatNumber(Number(item['ga:uniqueEvents'])),
                eventValue: Mojo.Format.formatCurrency(Number(item['ga:eventValue']), {fractionDigits:2})
            });
        }, this);
        
        this.controller.get('event-label-list').mojo.noticeUpdatedItems(0, this.items);
        this.controller.get('event-label-list').mojo.setLength(this.items.length);
        this.controller.get('event-label-list').mojo.setCount(this.items.length);
        
        var obj = this.store.get(this.item.id, 'eventLabelsChart');
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
            this.controller.get('event-label-chart').parentNode.show();
            var src = 'http://chart.apis.google.com/chart?cht=ls&chs=273x100&chxs=0,969695,12,0,lt,969695&chxt=r&chco=4C91CC&chf=bg,s,E4E5E2&chm=B,C9DCEA,0,0,0|r,7E7F7D,0,0.499,0.501|r,7E7F7D,0,0.998,1.0|r,7E7F7D,0,0.0,0.002&chds=0,' + max + '&chxr=0,0,' + max + ',' + steps + '&chd=t:' + data.join(',');
            this.controller.get('event-label-chart').update('<img src="' + src + '" id="chart-image" />');
        }
        else {
            this.controller.get('event-label-chart').parentNode.hide();
        }
        this.hideSpinner();
    }
    
});

Analytics.Scene.EventLabelDialog = Class.create({
    initialize : function (sceneAssistant, data)
    {
        this.sceneAssistant = sceneAssistant;
        this.controller = sceneAssistant.controller;
        this.data = data;
        
        this.handleClose = this.close.bind(this);
    },
    
    setup : function (widget)
    {
        this.widget = widget;
        this.controller.setupWidget(
            'dialog-button',
            {}, {
                buttonLabel : $L('Close'),
                buttonClass : '',
                disable : false
            }
        );
        Mojo.Event.listen(this.controller.get('dialog-button'), Mojo.Event.tap, this.handleClose);
    },
    
    activate : function ()
    {
        this.controller.get('dialog-title').update(this.data.label);
        var renderedInfo = Mojo.View.render({object: this.data, template: 'event-label/dialog-data'});
        this.controller.get('dialog-content').update(renderedInfo);
    },
    
    deactivate : function ()
    {
        Mojo.Event.stopListening(this.controller.get('dialog-button'), Mojo.Event.tap, this.handleClose);
        this.data = null;
        this.widget = null;
        this.sceneAssistant = null;
        this.controller = null;
        this.handleClose = null;
    },
    
    close : function ()
    {
        this.widget.mojo.close();
    }
});
Analytics.Scene.Goal = Class.create(Analytics.Util.Details, {
    
    initialize : function ($super, args)
    {
        $super(args);
        
        this.dataHandler = this.handleData.bind(this);
        this.chartHandler = this.handleChartData.bind(this);
        this.errorHandler = this.handleError.bind(this);
        this.filterHandle = this.handleFilter.bind(this);
        this.filterChangeHandle = this.handleFilterChange.bind(this);
        this.items = [];
    },
    
    setup : function ($super)
    {
        $super();
        this.controller.setupWidget(
            'goal-list',
            {
                itemTemplate: 'goal/data-item',
                emptyTemplate: 'empty-item',
                swipeToDelete: false,
                reorderable: false,
                renderLimit: 50,
                filterFunction: this.filterHandle
            }
        );
        Mojo.Event.listen(this.controller.get('goal-list'), Mojo.Event.filterImmediate,  this.filterChangeHandle);
        
        this.spacerDiv = this.controller.get('empty_spacer');
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        this.controller.get('goal-title').update(this.item.title + ' / ' + $L('Goals'));
        $super();
    },
    
    deactivate : function ($super)
    {
        $super();
    },
    
    cleanup : function ($super)
    {
        this.items = null;
        
        this.handleFilter = null;
        this.chartHandler = null;
        this.dataHandler = null;
        this.errorHandler = null;
        
        this.spacerDiv = null;
        
        $super();
    },
    
    refresh : function ()
    {
        this.store.invalidate(this.item.id, 'goal');
        this.store.invalidate(this.item.id, 'goalChart');
        this.items = [];
        this.showSpinner();
        this.getData();
    },
    
    getData : function ()
    {
        this.result = {};
        if (this.store.isValid(this.item.id, 'goal', this.period, this.startDate, this.endDate)) {
            this.getChartData();
        }
        else {
            if (!this.store.get(this.item.id, 'oauth_token')) {
                this.getAuth();
            }
            else {
                var starts = [];
                var ends = [];
                this.api.getData({
                    oauth_token: this.store.get(this.item.id, 'oauth_token'),
                    oauth_secret: this.store.get(this.item.id, 'oauth_secret'),
                    profileId: this.item.profileId,
                    metrics: 'ga:goalCompletionsAll,ga:goalStartsAll',
                    period: this.period,
                    dateFrom: this.startDate,
                    dateTo: this.endDate,
                    onSuccess: this.handleData.bind(this, 0),
                    onError: this.errorHandler
                });
            }
        }
    },
    
    getChartData : function ()
    {
        if (this.store.isValid(this.item.id, 'eventChart', this.period, this.startDate, this.endDate)) {
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
                metrics: 'ga:goalCompletionsAll',
                dimensions: dimension,
                period: this.period,
                dateFrom: this.startDate,
                dateTo: this.endDate,
                onSuccess: this.chartHandler,
                onError: this.errorHandler
            });
        }
    },
    
    handleData : function (run, result, startDate, endDate)
    {
        var ends = [];
        Object.extend(this.result, result);
        if (run < 2) {
            for (i = run*10+1; i <= run*10+10; i++) {
                ends.push('ga:goal' + i + 'Completions');
            }
            this.api.getData({
                oauth_token: this.store.get(this.item.id, 'oauth_token'),
                oauth_secret: this.store.get(this.item.id, 'oauth_secret'),
                profileId: this.item.profileId,
                metrics: ends.join(','),
                period: this.period,
                dateFrom: this.startDate,
                dateTo: this.endDate,
                onSuccess: this.handleData.bind(this, run+1),
                onError: this.errorHandler
            });
        }
        else {
            this.store.set(this.item.id, 'period', this.period);
            this.store.set(this.item.id, 'startDate', startDate);
            this.store.set(this.item.id, 'endDate', endDate);
            if (startDate && endDate) {
                this.setTitle(startDate, endDate);
                this.startDate = startDate;
                this.endDate = endDate;
            }
            this.store.set(this.item.id, 'goal', this.result);
            this.getChartData();
        }
    },
    
    handleChartData : function (result)
    {
        this.store.set(this.item.id, 'goalChart', result);
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
                return item.goal.toLowerCase().include(filterString.toLowerCase());
            }, this);
        }
        else
        {
            items = this.items;
        }
        this.controller.get('goal-list').mojo.noticeUpdatedItems(0, items);
        this.controller.get('goal-list').mojo.setLength(items.length);
        this.controller.get('goal-list').mojo.setCount(items.length);
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
            assistant : new Analytics.Scene.GoalDialog(this, evt.item)
        });
    },
    
    render : function ()
    {
        this.items = [];
        this.controller.get('goal-chart').update();
        var obj = this.store.get(this.item.id, 'goal');
        this.items.push({
            name: $L('All Goal Completions'),
            value: obj["ga:goalCompletionsAll"]
        });
        for (var i = 1; i <= 20; i++) {
            this.items.push({
                translation: Analytics.Util.ListTranslation,
                name: $L('Goal') + ' ' + i + ' ' + $L('Completions'),
                value: Mojo.Format.formatNumber(Number(obj['ga:goal' + i + 'Completions']))
            });
        }
        this.controller.get('goal-list').mojo.noticeUpdatedItems(0, this.items);
        this.controller.get('goal-list').mojo.setLength(this.items.length);
        this.controller.get('goal-list').mojo.setCount(this.items.length);
        this.hideSpinner();
        var ch = this.store.get(this.item.id, 'goalChart');
        var data = [];
        var start;
        var end;
        var max = 0;
        if (ch.length > 0) {
            ch.each(function (item, index) {
                if (index == 0) {
                    if (ch == 'day') {
                        start = item['ga:hour'];
                    }
                    else {
                        start = item['ga:date'];
                    }
                }
                if (index == ch.length - 1) {
                    if (ch == 'day') {
                        end = item['ga:hour'];
                    }
                    else {
                        end = item['ga:date'];
                    }
                }
                data.push(item['ga:goalCompletionsAll']);
            }, this);
            max = this.max(data);
            var steps = Math.ceil(max / 2);
        }
        if (max > 0) {
            this.controller.get('goal-chart').parentNode.show();
            var src = 'http://chart.apis.google.com/chart?cht=ls&chs=273x100&chxs=0,969695,12,0,lt,969695&chxt=r&chco=4C91CC&chf=bg,s,E4E5E2&chm=B,C9DCEA,0,0,0|r,7E7F7D,0,0.499,0.501|r,7E7F7D,0,0.998,1.0|r,7E7F7D,0,0.0,0.002&chds=0,' + max + '&chxr=0,0,' + max + ',' + steps + '&chd=t:' + data.join(',');
            this.controller.get('goal-chart').update('<img src="' + src + '" id="chart-image" />');
        }
        else {
            this.controller.get('goal-chart').parentNode.hide();
        }
    }
    
});

Analytics.Scene.GoalDialog = Class.create({
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
        this.controller.get('dialog-title').update(this.data.page);
        var renderedInfo = Mojo.View.render({object: this.data, template: 'goal/dialog-data'});
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
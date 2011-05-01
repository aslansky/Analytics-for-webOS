Analytics.Scene.Browsers = Class.create(Analytics.Util.Details, {
    
    initialize : function ($super, args)
    {
        $super(args);
        
        this.dataHandler = this.handleData.bind(this);
        this.errorHandler = this.handleError.bind(this);
        this.filterHandle = this.handleFilter.bind(this);
        this.filterChangeHandle = this.handleFilterChange.bind(this);
        this.tapHandle = this.handleTap.bind(this);
        this.items = [];
    },
    
    setup : function ($super)
    {
        $super();
        this.controller.setupWidget(
            'browser-list',
            {
                itemTemplate: 'browsers/data-item',
                emptyTemplate: 'empty-item',
                swipeToDelete: false,
                reorderable: false,
                renderLimit: 50,
                filterFunction: this.filterHandle
            }
        );
        Mojo.Event.listen(this.controller.get('browser-list'), Mojo.Event.listTap,  this.tapHandle);
        Mojo.Event.listen(this.controller.get('browser-list'), Mojo.Event.filterImmediate,  this.filterChangeHandle);
        
        this.spacerDiv = this.controller.get('empty_spacer');
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        this.controller.get('browser-title').update(this.item.title + ' / ' + $L('Browsers'));
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
        this.dataHandler = null;
        this.errorHandler = null;
        
        this.spacerDiv = null;
        
        $super();
    },
    
    refresh : function ()
    {
        this.store.invalidate(this.item.id, 'browser');
        this.items = [];
        this.showSpinner();
        this.getData();
    },
    
    getData : function ()
    {
        if (this.store.isValid(this.item.id, 'browser', this.period, this.startDate, this.endDate)) {
            this.render();
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
                    metrics: 'ga:visits,ga:pageviews,ga:bounces,ga:timeOnPage,ga:newVisits',
                    dimensions: 'ga:browser',
                    sort: '-ga:visits',
                    period: this.period,
                    dateFrom: this.startDate,
                    dateTo: this.endDate,
                    onSuccess: this.dataHandler,
                    onError: this.errorHandler
                });
            }
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
        this.store.set(this.item.id, 'browser', result);
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
                return item.browser.toLowerCase().include(filterString.toLowerCase());
            }, this);
        }
        else
        {
            items = this.items;
        }
        
        this.controller.get('browser-list').mojo.noticeUpdatedItems(0, items);
        this.controller.get('browser-list').mojo.setLength(items.length);
        this.controller.get('browser-list').mojo.setCount(items.length);
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
            assistant : new Analytics.Scene.BrowserDialog(this, evt.item)
        });
    },
    
    render : function ()
    {
        var obj = this.store.get(this.item.id, 'browser');
        this.controller.get('browser-chart').update();
        this.items = [];
        var visits = [];
        obj.each(function (item, index) {
            this.items.push({
                translation: Analytics.Util.ListTranslation,
                browser: item['ga:browser'],
                visits: Mojo.Format.formatNumber(Number(item['ga:visits'])),
                pageview: Mojo.Format.formatNumber(Number(item['ga:pageviews'])),
                bounce: Mojo.Format.formatPercent((Number(item['ga:bounces']) / Number(item['ga:visits'])) * 100),
                time: this.secondsToTime(Number(item['ga:timeOnPage'])/(Number(item['ga:visits']))),
                newVisits: Mojo.Format.formatPercent((Number(item['ga:newVisits']) / Number(item['ga:visits'])) * 100)
            });
            visits.push(Number(item['ga:visits']));
        }, this);
        var total = visits.sum();
        var threshold = Math.round(total / 50);
        var other = 0;
        var browsers = [];
        var cvisits = visits.findAll(function (item, index) {
            if (item > threshold) {
                browsers.push((this.items[index].browser == 'Internet Explorer') ? 'IE' : this.items[index].browser);
                return true;
            }
            else {
                other = other + item;
                return false;
            }
        }, this);
        cvisits.push(other);
        var max = this.max(cvisits);
        browsers.push($L('Others'));
        if (max > 0) {
            this.controller.get('browser-chart').parentNode.show();
            var src = 'http://chart.apis.google.com/chart?cht=p&chs=273x150&chxt=x&chxs=0,969695,12,0,lt&chco=4D8BBA&chf=bg,s,E4E5E2&chl=' + browsers.join("|") + '&chd=t:' + cvisits.join(',');
            this.controller.get('browser-chart').update('<img src="' + src + '" id="browser-image" />');
        }
        else {
            this.controller.get('browser-chart').parentNode.hide();
        }
        this.controller.get('browser-list').mojo.noticeUpdatedItems(0, this.items);
        this.controller.get('browser-list').mojo.setLength(this.items.length);
        this.controller.get('browser-list').mojo.setCount(this.items.length);
        this.hideSpinner();
    }
    
});

Analytics.Scene.BrowserDialog = Class.create({
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
        this.controller.get('dialog-title').update(this.data.browser);
        var renderedInfo = Mojo.View.render({object: this.data, template: 'browsers/dialog-data'});
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
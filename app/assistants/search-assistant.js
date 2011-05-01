Analytics.Scene.Search = Class.create(Analytics.Util.Details, {
    
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
            'search-list',
            {
                itemTemplate: 'traffic/data-item',
                emptyTemplate: 'empty-item',
                swipeToDelete: false,
                reorderable: false,
                renderLimit: 50,
                filterFunction: this.filterHandle
            }
        );
        Mojo.Event.listen(this.controller.get('search-list'), Mojo.Event.listTap,  this.tapHandle);
        Mojo.Event.listen(this.controller.get('search-list'), Mojo.Event.filterImmediate,  this.filterChangeHandle);
        
        this.spacerDiv = this.controller.get('empty_spacer');
    },
    
    aboutToActivate : function ($super, callback)
    {
        $super();
    },
    
    activate : function ($super)
    {
        this.controller.get('search-title').update(this.item.title + ' / ' + $L('Search Engines'));
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
        this.store.invalidate(this.item.id, 'search');
        this.items = [];
        this.showSpinner();
        this.getData();
    },
    
    getData : function ()
    {
        if (this.store.isValid(this.item.id, 'search', this.period, this.startDate, this.endDate)) {
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
                    dimensions: 'ga:medium,ga:referralPath,ga:source',
                    filters: 'ga:medium==organic',
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
        this.store.set(this.item.id, 'search', result);
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
                return item.source.toLowerCase().include(filterString.toLowerCase());
            }, this);
        }
        else
        {
            items = this.items;
        }
        this.controller.get('search-list').mojo.noticeUpdatedItems(0, items);
        this.controller.get('search-list').mojo.setLength(items.length);
        this.controller.get('search-list').mojo.setCount(items.length);
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
            assistant : new Analytics.Scene.TrafficDialog(this, evt.item)
        });
    },
    
    render : function ()
    {
        this.items = [];
        this.store.get(this.item.id, 'search').each(function (item, index) {
            this.items.push({
                translation: Analytics.Util.ListTranslation,
                source: item['ga:source'],
                path: item['ga:referralPath'],
                type: item['ga:medium'],
                visits: Mojo.Format.formatNumber(Number(item['ga:visits'])),
                pv: Mojo.Format.formatNumber(Number(item['ga:pageviews'])/Number(item['ga:visits']), {fractionDigits: 2}),
                bounce: Mojo.Format.formatPercent((Number(item['ga:bounces']) / Number(item['ga:visits'])) * 100),
                time: this.secondsToTime(Number(item['ga:timeOnPage'])/(Number(item['ga:visits']))),
                newVisits: Mojo.Format.formatPercent((Number(item['ga:newVisits']) / Number(item['ga:visits'])) * 100)
            });
        }, this);
        
        this.controller.get('search-list').mojo.noticeUpdatedItems(0, this.items);
        this.controller.get('search-list').mojo.setLength(this.items.length);
        this.controller.get('search-list').mojo.setCount(this.items.length);
        this.hideSpinner();
    },
    
    sortByPagviews : function (a, b) {
        var x = Number(a.pageview);
        var y = Number(b.pageview);
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    }
    
});
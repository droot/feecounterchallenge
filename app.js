(function() {
  var AppController, AppModel, EventDispatcher, InputView, TweetCollection, TweetModel, TweetView, TwitterView, initialize_app, root;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  root = typeof exports != "undefined" && exports !== null ? exports : this;
  EventDispatcher = {
    EVENT_TYPE_USER_ACTION: 'user_action',
    EVENT_SUBTYPE_ANALYZE_TWITTER: 'analyze_twitter'
  };
  _.extend(EventDispatcher, Backbone.Events);
  TweetModel = (function() {
    function TweetModel() {
      TweetModel.__super__.constructor.apply(this, arguments);
    }
    __extends(TweetModel, Backbone.Model);
    return TweetModel;
  })();
  TweetCollection = (function() {
    function TweetCollection() {
      TweetCollection.__super__.constructor.apply(this, arguments);
    }
    __extends(TweetCollection, Backbone.Collection);
    TweetCollection.prototype.model = TweetModel;
    return TweetCollection;
  })();
  TweetView = (function() {
    function TweetView() {
      this.render = __bind(this.render, this);;
      this.initialize = __bind(this.initialize, this);;      TweetView.__super__.constructor.apply(this, arguments);
    }
    __extends(TweetView, Backbone.View);
    TweetView.prototype.tagName = 'li';
    TweetView.prototype.initialize = function() {
      this.template = $('#tweet-template').template();
      return this.model.bind('change', this.render);
    };
    TweetView.prototype.events = {
      'click': "click_handler"
    };
    TweetView.prototype.click_handler = function(ev) {};
    TweetView.prototype.render = function() {
      $(this.el).html($.tmpl(this.template, this.model.toJSON()));
      return this;
    };
    return TweetView;
  })();
  TwitterView = (function() {
    function TwitterView() {
      this.refreshAll = __bind(this.refreshAll, this);;
      this.hide = __bind(this.hide, this);;
      this.show = __bind(this.show, this);;
      this.drawChart = __bind(this.drawChart, this);;
      this.update_handler = __bind(this.update_handler, this);;
      this.render = __bind(this.render, this);;
      this.initialize = __bind(this.initialize, this);;      TwitterView.__super__.constructor.apply(this, arguments);
    }
    __extends(TwitterView, Backbone.View);
    TwitterView.prototype.initialize = function() {
      this.model.tweets.bind('reset', this.refreshAll);
      return this.model.bind('change', this.update_handler);
    };
    TwitterView.prototype.render = function() {
      return this;
    };
    TwitterView.prototype.update_handler = function() {
      if (this.model.hasChanged('groups')) {
        return this.drawChart();
      }
    };
    TwitterView.prototype.drawChart = function() {
      var chart, data, idx, keys, x, _i, _len;
      data = new google.visualization.DataTable();
      data.addColumn('string', 'Hour');
      data.addColumn('number', 'Tweets');
      data.addRows(this.model.get('group_len'));
      keys = _.keys(this.model.get('groups'));
      idx = 0;
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        x = keys[_i];
        data.setValue(idx, 0, x);
        data.setValue(idx, 1, this.model.get('groups')[x]);
        idx++;
      }
      chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
      return chart.draw(data, {
        width: 1200,
        height: 400,
        title: 'Hourly Tweets',
        hAxis: {
          title: 'Hour',
          titleTextStyle: {
            color: 'red'
          }
        }
      });
    };
    TwitterView.prototype.show = function() {
      return $(this.el).show();
    };
    TwitterView.prototype.hide = function() {
      return $(this.el).hide();
    };
    TwitterView.prototype.refreshAll = function() {
      alert('hmm....');
      this.$('#tweet-list').html('');
      this.$('#tweet-list').listview();
      this.model.tweets.each(function(tweet) {
        var view;
        view = new TweetView({
          model: tweet
        });
        return this.$('#tweet-list').append(view.render().el);
      });
      return this.$('#tweet-list').listview('refresh');
    };
    TwitterView.prototype.showLoading = function() {
      return $.mobile.pageLoading();
    };
    TwitterView.prototype.hideLoading = function() {
      return $.mobile.pageLoading(true);
    };
    return TwitterView;
  })();
  AppModel = (function() {
    function AppModel() {
      AppModel.__super__.constructor.apply(this, arguments);
    }
    __extends(AppModel, Backbone.Model);
    AppModel.prototype.initialize = function() {
      return this.tweets = new TweetCollection();
    };
    return AppModel;
  })();
  InputView = (function() {
    function InputView() {
      this.click_handler = __bind(this.click_handler, this);;      InputView.__super__.constructor.apply(this, arguments);
    }
    __extends(InputView, Backbone.View);
    InputView.prototype.initialize = function() {};
    InputView.prototype.events = {
      'click #analyze_btn': 'click_handler'
    };
    InputView.prototype.click_handler = function(ev) {
      var id, screen_name;
      screen_name = this.$('#tw_handle_input').val();
      id = 'twitter';
      if (!screen_name) {
        alert("Please enter a valid twitter handle.");
        return;
      }
      return EventDispatcher.trigger(EventDispatcher.EVENT_TYPE_USER_ACTION, EventDispatcher.EVENT_SUBTYPE_ANALYZE_TWITTER, screen_name);
    };
    return InputView;
  })();
  AppController = (function() {
    function AppController() {
      this.twitter_response_callback = __bind(this.twitter_response_callback, this);;
      this.load_twitter_view = __bind(this.load_twitter_view, this);;
      this.show_view = __bind(this.show_view, this);;
      this.event_handler = __bind(this.event_handler, this);;
      this.initialize = __bind(this.initialize, this);;      AppController.__super__.constructor.apply(this, arguments);
    }
    __extends(AppController, Backbone.Router);
    AppController.prototype.initialize = function(args) {
      this.model = new AppModel(args);
      this.input_view = new InputView({
        model: this.model,
        el: $('#nav-bar')
      });
      this.twitter_view = new TwitterView({
        model: this.model,
        el: $('#twitter-view')
      });
      EventDispatcher.bind(EventDispatcher.EVENT_TYPE_USER_ACTION, this.event_handler);
      return this;
    };
    AppController.prototype.event_handler = function(e_type, e_data) {
      switch (e_type) {
        case EventDispatcher.EVENT_SUBTYPE_ANALYZE_TWITTER:
          return this.show_view(e_data);
      }
    };
    AppController.prototype.show_view = function(e_data) {
      this.twitter_view.show();
      return this.load_twitter_view(e_data);
    };
    AppController.prototype.load_twitter_view = function(term) {
      var query_url, user_handle;
      if (this.model.tweets.length > 0) {
        return;
      }
      this.twitter_view.showLoading();
      user_handle = term;
      query_url = "http://api.twitter.com/1/statuses/user_timeline.json?screen_name=" + user_handle + "&count=50&callback=?";
      $.getJSON(query_url, this.twitter_response_callback);
      return this;
    };
    AppController.prototype.hour_filter = function(x) {
      var d, twelve_hours_from_now;
      d = Date.parse(x.created_at);
      twelve_hours_from_now = Date.today().add(-12).hours();
      console.log("tweeted at: " + (d.toString()) + ", twitter date: " + x.created_at);
      if (d > twelve_hours_from_now) {
        return true;
      } else {
        console.log("Eliminating.... tweeted at: " + (d.toString('dddd, MMMM d, yyyy')) + ", twelve hours ago: " + twelve_hours_from_now);
        return false;
      }
    };
    AppController.prototype.hourly_index = function(x) {
      var d, higher_hour, hour, lower_hour;
      d = Date.parse(x.created_at);
      hour = d.getHours();
      lower_hour = hour % 12;
      higher_hour = (hour + 1) % 12;
      return "" + (d.toString('dddd')) + ", " + lower_hour + " - " + higher_hour + " " + (d.toString('tt'));
      return d.toString('hh tt');
    };
    AppController.prototype.twitter_response_callback = function(data) {
      var app, groups, keys, t_coll, x, _fn, _i, _len;
      this.twitter_view.hideLoading();
      app = this;
      t_coll = _.filter(data.slice(0, 50), this.hour_filter);
      groups = _.groupBy(t_coll, this.hourly_index);
      keys = _.keys(groups);
      _fn = function(x) {
        return groups[x] = groups[x].length;
      };
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        x = keys[_i];
        _fn(x);
      }
      this.model.set({
        groups: groups,
        group_len: keys.length
      });
    };
    return AppController;
  })();
  root.EventDispatcher = EventDispatcher;
  initialize_app = function(x) {
    var appc;
    return appc = new AppController(x);
  };
  root.initialize_app = initialize_app;
}).call(this);

#Global Event Dispatcher
root = exports ? this
EventDispatcher =
	EVENT_TYPE_USER_ACTION:'user_action'
	EVENT_SUBTYPE_ANALYZE_TWITTER:'analyze_twitter'

_.extend(EventDispatcher, Backbone.Events)

#Twitter related data
class TweetModel extends Backbone.Model

class TweetCollection extends Backbone.Collection
	model: TweetModel

class TweetView extends Backbone.View
	tagName: 'li',
	initialize: =>
	    @template = $('#tweet-template').template()
	    @model.bind('change', @render)

	events:
		'click': "click_handler"

	click_handler: (ev)->
		#alert 'you clicked on a particular tweet...'

	render: =>
	    $(@el).html($.tmpl(@template, @model.toJSON()))
	    @

class TwitterView extends Backbone.View
	initialize: =>
		@model.tweets.bind('reset', @refreshAll)
		@model.bind('change', @update_handler)

	#events:
		#'click .search': "search"

	render: =>
		@

	update_handler: =>
		if @model.hasChanged('groups')
			@drawChart()

	drawChart: =>
		data = new google.visualization.DataTable()
		data.addColumn('string', 'Hour')
		data.addColumn('number', 'Tweets')
		data.addRows(@model.get('group_len'))
		keys = _.keys(@model.get('groups'))
		idx = 0
		for x in keys
			data.setValue(idx, 0, x)
			data.setValue(idx, 1, @model.get('groups')[x])
			idx++

		chart = new google.visualization.ColumnChart(document.getElementById('chart_div'))
		chart.draw(data, {
							width: 1200,
							height: 400,
							title: 'Hourly Tweets',
							hAxis: {
									title: 'Hour',
									titleTextStyle: {color: 'red'}
									}
						})

	show: ()=>
		$(@el).show()
	
	hide: ()=>
		$(@el).hide()

	refreshAll: ()=>
		alert 'hmm....'
		@$('#tweet-list').html('')
		@$('#tweet-list').listview()
		@model.tweets.each (tweet)->
				view = new TweetView model: tweet
				@$('#tweet-list').append(view.render().el)
		@$('#tweet-list').listview('refresh')

	showLoading: ->
	    $.mobile.pageLoading()

	hideLoading: ->
	    $.mobile.pageLoading(true)

class AppModel extends Backbone.Model
	initialize: ()->
		@tweets = new TweetCollection()

class InputView extends Backbone.View
	initialize: ()->

	events:
		'click #analyze_btn': 'click_handler'
	
	click_handler: (ev)=>
		screen_name = @$('#tw_handle_input').val()
		id = 'twitter'
		if not screen_name
			alert "Please enter a valid twitter handle."
			return
		EventDispatcher.trigger(EventDispatcher.EVENT_TYPE_USER_ACTION, EventDispatcher.EVENT_SUBTYPE_ANALYZE_TWITTER, screen_name)


class AppController extends Backbone.Router
	initialize: (args)=>
		@model = new AppModel args
		@input_view = new InputView model: @model, el: $('#nav-bar')
		@twitter_view = new TwitterView model: @model, el: $('#twitter-view')

		EventDispatcher.bind(EventDispatcher.EVENT_TYPE_USER_ACTION, @event_handler)
		#EventDispatcher.trigger(EventDispatcher.EVENT_TYPE_USER_ACTION, EventDispatcher.EVENT_SUBTYPE_SWITCH_VIEW, 'schedule')
		@

	event_handler: (e_type, e_data)=>
		switch e_type
			when EventDispatcher.EVENT_SUBTYPE_ANALYZE_TWITTER then @show_view(e_data)

	show_view: (e_data)=>
		@twitter_view.show()
		@load_twitter_view(e_data)

	load_twitter_view: (term)=>
		#show twitter_view 
		return if @model.tweets.length > 0

		@twitter_view.showLoading()
		#query_url = "http://search.twitter.com/search.json?lang=en&callback=?&q=#{term}"
		user_handle = term
		query_url = "http://api.twitter.com/1/statuses/user_timeline.json?screen_name=#{user_handle}&count=50&callback=?"
		$.getJSON(query_url, @twitter_response_callback)
		@

	hour_filter: (x)->
		d = Date.parse(x.created_at)
		twelve_hours_from_now = Date.today().add(-12).hours()
		console.log("tweeted at: #{d.toString()}, twitter date: #{x.created_at}")
		if d > twelve_hours_from_now
			return true
		else
			console.log("Eliminating.... tweeted at: #{d.toString('dddd, MMMM d, yyyy')}, twelve hours ago: #{twelve_hours_from_now}")
			return false

	hourly_index: (x)->
		d = Date.parse(x.created_at)
		#return d.getHours()
		hour = d.getHours()
		lower_hour = hour % 12
		higher_hour = (hour + 1) % 12
		return "#{d.toString('dddd')}, #{lower_hour} - #{higher_hour} #{d.toString('tt')}"
		return d.toString('hh tt')

	twitter_response_callback: (data)=>
		@twitter_view.hideLoading()
		app = @
		t_coll = _.filter(data[0...50], @hour_filter)
		groups = _.groupBy(t_coll, @hourly_index)
		keys = _.keys(groups)
		for x in keys
			do (x)->
				#alert "#{x} - #{groups[x].length}"
				groups[x] = groups[x].length
		@model.set groups:groups, group_len:keys.length
		return

root.EventDispatcher = EventDispatcher

initialize_app = (x)->
	appc = new AppController x

root.initialize_app = initialize_app

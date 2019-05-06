"use strict";
(function() {

    var User = function(data) {
        this.defaults = {
            is_logged_in: false,
            fbid: null,
            firstname: 'Guest',
            lastname: '',
            email: '',
            settings: {} // A user constant settings
        };
        this.getFirstName = function() { return this.data.firstname; };
        this.isLoggedIn = function() { return this.data.is_logged_in; };

        this.apply = function(data) {};

        this.view = {

            setLoggedIn: function() {},
            setLoggedOut: function() {},
        };

        return this.init(data);
    };

    var TodosWidget = function(data) {
        this.defaultData = [ // Ordered by index
            { 'text': 'Eat some breakfast', 'priority': 0, 'is_done': false },
            { 'text': 'This to-do must be important', 'priority': 1, 'is_done': false },
            { 'text': 'Take over the world', 'priority': 0, 'is_done': true }
        ];

        this.init = function(data) {};

        return this.init(data);
    };

    var SetAlarmWidget = function() {

        this.AlarmTune = function(data) {
            this.init = function(data) {};


            return this.init(data);
        };

        this.AlarmSnooze = function(data) {
            this.init = function(data) {};


            return this.init(data);
        };


    };

    this.Models = {
        Alarm: {

            timer: null,

            set: function() {},
            stop: function() {}

        },
        Player: {
            init: function($dom) {}
        },

        YouTube: {

        }


    };

    var JWUWidget = function(data) {
        this.init = function(data) {};

        return this.init(data);
    };

    var QuoteWidget = function(data) {
        this.init = function(data) {};

        return this.init(data);
    };


    var DomHandler = {
        Header: {
            setLoggedInView: function() {},
            setLoggedOutView: function() {}
        },
        Todos: {

        },
        ClockWidget: {
            SoundController: {
                changeView: function(type, title, text) {}
            },
            SnoozeController: {
                changeView: function(mins, duration, isOn) {}
            },
            WakeUpTimeController: {
                changeClockType: function() {}
            }
        },
    };


    $(document).ready(function() {
        window.App = function(data) {
            this.User = new User(data && data.user);
            this.TodosWidget = new TodosWidget(data && data.todos);
            this.SetAlarmWidget = new SetAlarmWidget(data && data.alarm);
            this.SetAlarmWidget = new SetAlarmWidget(data && data.alarm);
        };
    });


})();
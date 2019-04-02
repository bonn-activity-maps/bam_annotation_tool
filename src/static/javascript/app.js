angular.module('CVGTool', ['ui.router'])

    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider

            .state('home', {
                url: "/home",
                templateUrl: "static/views/home.html",
                controller: "homeCtrl"
            })

            .state('login', {
                url: "/login",
                templateUrl: "static/views/login.html",
                controller: "loginCtrl"
            });

        $urlRouterProvider.otherwise('home');
});

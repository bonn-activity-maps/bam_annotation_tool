angular.module('CVG_tool', ['ui.router', 'ui.bootstrap'])

    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider

            .state('login', {
                url: "/login",
                templateUrl: "templates/login.html",
                controller: "loginCtrl"
            })

            .state('main', {
                url: "/",
                templateUrl: "templates/main.html",
                controller: "mainCtrl"
            });

        $urlRouterProvider.otherwise('main');
});

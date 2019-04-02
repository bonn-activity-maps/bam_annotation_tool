angular.module('CVGTool', ['ui.router', 'thatisuday.dropzone'])

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
            })

            .state('admin', {
              url: "/admin",
              templateUrl: "static/views/admin.html",
              controller: "adminCtrl"
            });

        $urlRouterProvider.otherwise('home');
});

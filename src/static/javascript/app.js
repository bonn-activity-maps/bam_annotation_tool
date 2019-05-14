angular.module('CVGTool', ['ui.router', 'thatisuday.dropzone', 'ngMaterial', 'rzSlider'])

    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider

            .state('tool', {
                url: "/tool",
                templateUrl: "static/views/tool.html",
                controller: "toolCtrl"
            })

            .state('taskHome', {
              url: "/taskHome",
              templateUrl: "static/views/taskHome.html",
              controller: "taskHomeCtrl"

            })

            .state('login', {
                url: "/login",
                templateUrl: "static/views/login.html",
                controller: "loginCtrl"
            })

            .state('adminUsers', {
              url: "/admin/users",
              templateUrl: "static/views/adminUsers.html",
              controller: "adminUsersCtrl"
            })

            .state('adminAnnotations', {
              url: "/admin/annotations",
              templateUrl: "static/views/adminAnnotations.html"
            })

            .state('adminDatasets', {
              url: "/admin/datasets",
              templateUrl: "static/views/adminDatasets.html",
              controller: "adminDatasetsCtrl"
            })

            .state('adminStatistics', {
              url: "/admin/statistics",
              templateUrl: "static/views/adminStatistics.html"
            });

        $urlRouterProvider.otherwise('login');
});

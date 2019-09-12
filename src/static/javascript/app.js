angular.module('CVGTool', ['ui.router', 'thatisuday.dropzone', 'ngMaterial', 'rzSlider', 'ngToast'])

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

        .state('tool', {
        url: "/tool",
        templateUrl: "static/views/tool.html",
        controller: "toolCtrl",
        params: {
            obj: null
        }
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

    .state('adminTasks', {
        url: "/admin/tasks",
        templateUrl: "static/views/adminTasks.html",
        controller: "adminTasksCtrl"
    })

    .state('adminStatistics', {
        url: "/admin/statistics",
        templateUrl: "static/views/adminStatistics.html"
    });

    $urlRouterProvider.otherwise('login');
});
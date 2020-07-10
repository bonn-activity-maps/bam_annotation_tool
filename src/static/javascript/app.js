angular.module("lodash", []).constant("_", window._);

angular.module('CVGTool', ['ui.router', 'ngMaterial', 'ngAnimate', 'rzSlider', 'ngToast', 'ui.bootstrap', 'cfp.hotkeys', 'chart.js'])

.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $stateProvider

        .state('tool', {
        url: "/tool",
        templateUrl: "static/views/toolv2.html",
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
    })

    .state('adminUserActions', {
        url: "/admin/useractions",
        templateUrl: "static/views/adminUserActions.html",
        controller: "adminUserActionsCtrl"
    });

    $urlRouterProvider.otherwise('login');

    $httpProvider.interceptors.push(function($q, $window) {
        return {
            'responseError': function(response){
                if(response.status === 401){
                    $window.location.href = "/#/login";
                }
                return $q.reject(response);
            }
        };
    });
});
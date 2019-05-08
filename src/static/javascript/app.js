angular.module('CVGTool', ['ui.router', 'thatisuday.dropzone', 'ngMaterial', 'rzSlider'])

    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider

            .state('tool', {
                url: "/tool",
                templateUrl: "static/views/tool.html",
                controller: "toolCtrl"
            })

            .state('login', {
                url: "/login",
                templateUrl: "static/views/login.html",
                controller: "loginCtrl"
            })

            .state('adminUsers', {
              url: "/admin/users",
              templateUrl: "static/views/adminUsers.html"
            })

            .state('adminAnnotations', {
              url: "/admin/annotations",
              templateUrl: "static/views/adminAnnotations.html"
            })

            .state('adminVideos', {
              url: "/admin/videos",
              templateUrl: "static/views/adminVideos.html",
              controller: "adminVideosCtrl"
            })

            .state('adminStatistics', {
              url: "/admin/statistics",
              templateUrl: "static/views/adminStatistics.html"
            });

        $urlRouterProvider.otherwise('login');
});

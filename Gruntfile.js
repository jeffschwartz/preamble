module.exports = function ( grunt ) {

    // Project configuration.
    grunt.initConfig({
        pkg    : grunt.file.readJSON( 'package.json' ),
        less   : {
            production  : {
                files : {
                    "stylesheets/preamble.css" : "stylesheets/preamble.less"
                }
            }
        },
        watch  : {
            scripts : {
                files   : ['**/*.less'],
                tasks   : ['less'],
                options : {
                    interrupt : true
                }
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks( 'grunt-contrib-less' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    // Default task(s).
    grunt.registerTask( 'default', ['watch'] );

    // Alias Tasks
    //grunt.registerTask( 'dev', 'Running Grunt dev', ['less:production', 'concat:dist', 'imagemin'] );
    //grunt.registerTask( 'prod', 'Running Grunt prod', ['less:production', 'concat:dist', 'uglify:prod', 'imagemin'] );

};

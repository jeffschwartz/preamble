module.exports = function ( grunt ) {

    // Project configuration.
    grunt.initConfig( {
        pkg    : grunt.file.readJSON( 'package.json' ),
        uglify: {
            my_target: {
                files: {
                    'dist/javascripts/preamble.min.js': ['dist/javascripts/preamble.js']
                }
            }
        },
        compress: {
            main: {
                options: {
                  mode: 'gzip'
                },
                expand: true,
                src: ['dist/javascripts/preamble.min.js'],
                ext: '.gz.js'
            }
        },
        copy: {
            todist: {
                files: [
                    {src: ['javascripts/preamble.js'], dest: 'dist/'},
                    {src: ['stylesheets/preamble.css'], dest: 'dist/'}
                ]
            }
        },
        watch  : {
            scripts : {
                files   : ['javascripts/preamble.js', 'stylesheets/preamble.css'],
                tasks   : ['dist'],
                options : {
                    interrupt : true
                }
            }
        }
    } );

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.loadNpmTasks( 'grunt-contrib-copy' );

    // Default task(s).
    grunt.registerTask( 'default', ['watch'] );

    // Alias Tasks
    grunt.registerTask( 'dist', 'Running Grunt prod dist', ['copy:todist', 'uglify', 'compress'] );

};

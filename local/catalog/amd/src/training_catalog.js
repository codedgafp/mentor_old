/**
 * Javascript containing function of the training catalog
 */

define([
    'jquery',
    'jqueryui',
    'local_mentor_core/mentor',
    'format_edadmin/format_edadmin',
    'core/templates',
], function ($, ui, mentor, format_edadmin, templates) {

    var trainingCatalog = {
        /**
         * Init JS
         */
        init: function () {

            // Get all session data to the training catalog.
            this.sessionData = JSON.parse($('#available-sessions').text());

            this.initCopyLink();

            this.initTrainingObjective();

            this.initTrainingSession();

            this.initSessionTileEvent();
        },
        /**
         * Init copy training catalog link event.
         */
        initCopyLink: function () {
            $('.copy-training-link').on('click', function (e) {
                e.preventDefault();

                var copyLinkButton = e.currentTarget;

                var trainingId = $(this).data('trainingid');

                var link = M.cfg.wwwroot + '/catalog/' + trainingId;

                navigator.clipboard.writeText(link).then(function () {
                    mentor.dialog("<div>" + M.util.get_string('copylinktext', 'local_mentor_core') + "</div>", {
                        close: function () {
                            copyLinkButton.focus();
                        },
                        title: M.util.get_string('confirmation', 'admin'),
                        position: {my: "center", at: "top+20"},
                        buttons: [
                            {
                                text: "OK",
                                class: "btn btn-primary",
                                click: function () {
                                    $(this).dialog("close");
                                    copyLinkButton.focus();
                                }
                            }
                        ]
                    });
                }, function () {
                    mentor.dialog("<div>" + M.util.get_string('copylinkerror', 'local_mentor_core') + link + "</div>", {
                        close: function () {
                            copyLinkButton.focus();
                        },
                        title: M.util.get_string('error', 'moodle'),
                        position: {my: "center", at: "top+20"},
                        buttons: [
                            {
                                text: "OK",
                                class: "btn btn-primary",
                                click: function () {
                                    $(this).dialog("close");
                                    copyLinkButton.focus();
                                }
                            }
                        ]
                    });
                });
            });
        },
        /**
         * Init training catalog objective event show/hide text.
         */
        initTrainingObjective: function () {

            var initialHeight = $('.training-goal').height();

            // 100px is nearly equals to 4 text lines.
            if (initialHeight > 130) {
                $('.training-goal').addClass('truncate');
                $('#gradientmask').removeClass('hide');
                $('.show-more').removeClass('hide');
            }

            $('.show-more, #gradientmask').click(function (e) {
                $('.show-more').addClass('hide');
                $('#gradientmask').addClass('hide');
                $('.show-less').removeClass('hide');
                $('.training-goal').removeClass('truncate');
            });

            $('.show-less').click(function (e) {
                $('.show-less').addClass('hide');
                $('.show-more').removeClass('hide');
                $('#gradientmask').removeClass('hide');
                $('.training-goal').addClass('truncate');
            });

            $(window).on('resize', function () {
                $('.show-more:before').width($('#training-objective').width());
            });

        },
        /**
         * Init view sessions tile training catalog event.
         */
        initTrainingSession: function () {
            var sessionList = $('.session');

            if (sessionList.length > 3) {
                $('.show-sessions').removeClass('hide');
                $('.session').slice(3).hide();

                $('.show-sessions').click(function (e) {
                    if ($(e.currentTarget).hasClass('more')) {
                        $('.session').slice(3).show();
                        $('.show-sessions').removeClass('more');
                        $('.show-sessions').addClass('less');
                    } else {
                        $('.session').slice(3).hide();
                        $('.show-sessions').addClass('more');
                        $('.show-sessions').removeClass('less');
                    }
                });
            }
        },
        /**
         * Get session data by session id.
         *
         * @param {int} sessionId
         * @returns {JSON}
         */
        getSessionDataById: function (sessionId) {
            return this.sessionData.find(function (x) {
                return x.id == sessionId;
            });
        },
        /**
         * Init session tile event.
         */
        initSessionTileEvent: function () {
            var that = this;

            // Trigger click event to available enrol and enrol sessIon tile.
            $('.session.available-enrol, .session.is-enrol').click(function (e) {

                // Not use event if is preview.
                if ($(e.currentTarget).hasClass('session-preview')) {
                    return;
                }

                if ($('body').hasClass('notloggedin')) {
                    // Create pop-in to redirect login page.
                    mentor.dialog(
                        '<div id="session-not-login-popin">' +
                        M.util.get_string('nologginsessionaccess', 'local_catalog') + '<div>',
                        {
                            width: 500,
                            title: M.util.get_string('registrationsession', 'local_catalog'),
                            buttons: [
                                {
                                    // Login page redirect.
                                    text: M.util.get_string('toconnect', 'local_catalog'),
                                    class: "btn btn-primary",
                                    click: function () {
                                        window.location.href = M.cfg.wwwroot + '/login/index.php';
                                    }
                                },
                                {
                                    // Cancel button
                                    text: M.util.get_string('cancel', 'format_edadmin'),
                                    class: "btn btn-secondary",
                                    click: function () {
                                        // Just close the modal.
                                        $(this).dialog("destroy");
                                    }
                                }]
                        });

                    return;
                }

                var sessionId = $(e.currentTarget).data().sessionId;

                // Check if session id is defined.
                if (typeof sessionId === 'undefined') {
                    return;
                }

                // Get session data.
                var sessionData = that.getSessionDataById(sessionId);

                // Check if user is enrol to session.
                if (sessionData.isenrol) {
                    that.getSessionEnrolPopin(sessionData);
                    return;
                }

                format_edadmin.ajax_call({
                    url: M.cfg.wwwroot + '/local/catalog/ajax/ajax.php',
                    controller: 'catalog',
                    action: 'get_session_enrolment_data',
                    format: 'json',
                    sessionid: sessionId,
                    callback: function (response) {

                        response = JSON.parse(response);

                        if (!response.success) {
                            console.error(response.message);
                            return;
                        }

                        var responseData = response.message;

                        if (responseData.selfenrolment) {
                            sessionData.isselfenrolment = true;
                            sessionData.hasselfregistrationkey = responseData.hasselfregistrationkey;
                        } else {
                            sessionData.isotherenrolement = true;
                            sessionData.message = responseData.message;
                        }

                        that.getSessionEnrolPopin(sessionData);
                    }
                });
            });
        },

        getSessionEnrolPopin: function (sessionData) {
            var that = this;

            templates.renderForPromise('local_catalog/session-popin', sessionData)
                .then(function (_ref) {
                    var html = _ref.html;

                    var buttons = [];

                    // Add access session button if user is enrol to sesison.
                    if (sessionData.isenrol && (!sessionData.isopenedregistration || sessionData.istutor)) {
                        buttons.push({
                            // Remove button
                            text: M.util.get_string('access', 'local_catalog'),
                            id: 'confirm-move-session',
                            class: "btn btn-primary",
                            click: function () {
                                window.location.href = sessionData.courseurl;
                            }
                        });
                    }

                    // Add enrolment button if self enrol is enable to session.
                    if (sessionData.isselfenrolment) {
                        buttons.push({
                            // Remove button
                            text: M.util.get_string('register', 'local_catalog'),
                            id: 'confirm-move-session',
                            class: "btn btn-primary",
                            click: function () {
                                that.enrolmentToSession(sessionData);
                            }
                        });
                    }

                    // Add cancel button.
                    buttons.push({
                        // Cancel button
                        text: M.util.get_string('cancel', 'format_edadmin'),
                        class: "btn btn-secondary",
                        click: function () {
                            // Just close the modal.
                            $(this).dialog("destroy");
                        }
                    });

                    // Create pop-in enrolment.
                    mentor.dialog('<div id="session-enrol-popin">' + html + '<div>', {
                        width: 650,
                        title: sessionData.fullname,
                        buttons: buttons
                    });
                });
        },
        /**
         * Create enrolment pop-in
         *
         * @param {Object} sessionData
         */
        enrolmentToSession: function (sessionData) {

            // Retrieves the key that the user has entered.
            var enrolmentKey = $('#enrolmentkey').val();

            format_edadmin.ajax_call({
                url: M.cfg.wwwroot + '/local/catalog/ajax/ajax.php',
                controller: 'catalog',
                action: 'enrol_current_user',
                format: 'json',
                sessionid: sessionData.id,
                enrolmentkey: enrolmentKey,
                callback: function (ajaxResponse) {
                    ajaxResponse = JSON.parse(ajaxResponse);

                    if (ajaxResponse.success == true) {
                        var urlredirection = ajaxResponse.message;

                        if (sessionData.isopenedregistration && !sessionData.istutor) {
                            urlredirection = M.cfg.wwwroot + '/local/catalog/pages/training.php?trainingid=' + sessionData.trainingid;
                        }

                        window.location.href = urlredirection;
                    } else {
                        $('.enrolment-warning').html(ajaxResponse.message);
                        $('#enrolmentkey-container input').addClass("warning");
                    }
                }
            });
        }
    };

    // Add object to window to be called outside require.
    window.trainingCatalog = trainingCatalog;
    return trainingCatalog;
});

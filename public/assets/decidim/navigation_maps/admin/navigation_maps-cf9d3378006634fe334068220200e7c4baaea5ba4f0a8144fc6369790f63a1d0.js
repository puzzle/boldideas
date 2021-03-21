/*!
 * jQuery Form Plugin
 * version: 3.51.0-2014.06.20
 * Requires jQuery v1.5 or later
 * Copyright (c) 2014 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
/*global ActiveXObject */

// AMD support
(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // using AMD; register as anon module
        define(['jquery'], factory);
    } else {
        // no AMD; invoke directly
        factory( (typeof(jQuery) != 'undefined') ? jQuery : window.Zepto );
    }
}

(function($) {
"use strict";

/*
    Usage Note:
    -----------
    Do not use both ajaxSubmit and ajaxForm on the same form.  These
    functions are mutually exclusive.  Use ajaxSubmit if you want
    to bind your own submit handler to the form.  For example,

    $(document).ready(function() {
        $('#myForm').on('submit', function(e) {
            e.preventDefault(); // <-- important
            $(this).ajaxSubmit({
                target: '#output'
            });
        });
    });

    Use ajaxForm when you want the plugin to manage all the event binding
    for you.  For example,

    $(document).ready(function() {
        $('#myForm').ajaxForm({
            target: '#output'
        });
    });

    You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
    form does not have to exist when you invoke ajaxForm:

    $('#myForm').ajaxForm({
        delegation: true,
        target: '#output'
    });

    When using ajaxForm, the ajaxSubmit function will be invoked for you
    at the appropriate time.
*/

/**
 * Feature detection
 */
var feature = {};
feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
feature.formdata = window.FormData !== undefined;

var hasProp = !!$.fn.prop;

// attr2 uses prop when it can but checks the return type for
// an expected string.  this accounts for the case where a form 
// contains inputs with names like "action" or "method"; in those
// cases "prop" returns the element
$.fn.attr2 = function() {
    if ( ! hasProp ) {
        return this.attr.apply(this, arguments);
    }
    var val = this.prop.apply(this, arguments);
    if ( ( val && val.jquery ) || typeof val === 'string' ) {
        return val;
    }
    return this.attr.apply(this, arguments);
};

/**
 * ajaxSubmit() provides a mechanism for immediately submitting
 * an HTML form using AJAX.
 */
$.fn.ajaxSubmit = function(options) {
    /*jshint scripturl:true */

    // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
    if (!this.length) {
        log('ajaxSubmit: skipping submit process - no element selected');
        return this;
    }

    var method, action, url, $form = this;

    if (typeof options == 'function') {
        options = { success: options };
    }
    else if ( options === undefined ) {
        options = {};
    }

    method = options.type || this.attr2('method');
    action = options.url  || this.attr2('action');

    url = (typeof action === 'string') ? $.trim(action) : '';
    url = url || window.location.href || '';
    if (url) {
        // clean url (don't include hash vaue)
        url = (url.match(/^([^#]+)/)||[])[1];
    }

    options = $.extend(true, {
        url:  url,
        success: $.ajaxSettings.success,
        type: method || $.ajaxSettings.type,
        iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
    }, options);

    // hook for manipulating the form data before it is extracted;
    // convenient for use with rich editors like tinyMCE or FCKEditor
    var veto = {};
    this.trigger('form-pre-serialize', [this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
        return this;
    }

    // provide opportunity to alter form data before it is serialized
    if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSerialize callback');
        return this;
    }

    var traditional = options.traditional;
    if ( traditional === undefined ) {
        traditional = $.ajaxSettings.traditional;
    }

    var elements = [];
    var qx, a = this.formToArray(options.semantic, elements);
    if (options.data) {
        options.extraData = options.data;
        qx = $.param(options.data, traditional);
    }

    // give pre-submit callback an opportunity to abort the submit
    if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSubmit callback');
        return this;
    }

    // fire vetoable 'validate' event
    this.trigger('form-submit-validate', [a, this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
        return this;
    }

    var q = $.param(a, traditional);
    if (qx) {
        q = ( q ? (q + '&' + qx) : qx );
    }
    if (options.type.toUpperCase() == 'GET') {
        options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
        options.data = null;  // data is null for 'get'
    }
    else {
        options.data = q; // data is the query string for 'post'
    }

    var callbacks = [];
    if (options.resetForm) {
        callbacks.push(function() { $form.resetForm(); });
    }
    if (options.clearForm) {
        callbacks.push(function() { $form.clearForm(options.includeHidden); });
    }

    // perform a load on the target only if dataType is not provided
    if (!options.dataType && options.target) {
        var oldSuccess = options.success || function(){};
        callbacks.push(function(data) {
            var fn = options.replaceTarget ? 'replaceWith' : 'html';
            $(options.target)[fn](data).each(oldSuccess, arguments);
        });
    }
    else if (options.success) {
        callbacks.push(options.success);
    }

    options.success = function(data, status, xhr) { // jQuery 1.4+ passes xhr as 3rd arg
        var context = options.context || this ;    // jQuery 1.4+ supports scope context
        for (var i=0, max=callbacks.length; i < max; i++) {
            callbacks[i].apply(context, [data, status, xhr || $form, $form]);
        }
    };

    if (options.error) {
        var oldError = options.error;
        options.error = function(xhr, status, error) {
            var context = options.context || this;
            oldError.apply(context, [xhr, status, error, $form]);
        };
    }

     if (options.complete) {
        var oldComplete = options.complete;
        options.complete = function(xhr, status) {
            var context = options.context || this;
            oldComplete.apply(context, [xhr, status, $form]);
        };
    }

    // are there files to upload?

    // [value] (issue #113), also see comment:
    // https://github.com/malsup/form/commit/588306aedba1de01388032d5f42a60159eea9228#commitcomment-2180219
    var fileInputs = $('input[type=file]:enabled', this).filter(function() { return $(this).val() !== ''; });

    var hasFileInputs = fileInputs.length > 0;
    var mp = 'multipart/form-data';
    var multipart = ($form.attr('enctype') == mp || $form.attr('encoding') == mp);

    var fileAPI = feature.fileapi && feature.formdata;
    log("fileAPI :" + fileAPI);
    var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;

    var jqxhr;

    // options.iframe allows user to force iframe mode
    // 06-NOV-09: now defaulting to iframe mode if file input is detected
    if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
        // hack to fix Safari hang (thanks to Tim Molendijk for this)
        // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
        if (options.closeKeepAlive) {
            $.get(options.closeKeepAlive, function() {
                jqxhr = fileUploadIframe(a);
            });
        }
        else {
            jqxhr = fileUploadIframe(a);
        }
    }
    else if ((hasFileInputs || multipart) && fileAPI) {
        jqxhr = fileUploadXhr(a);
    }
    else {
        jqxhr = $.ajax(options);
    }

    $form.removeData('jqxhr').data('jqxhr', jqxhr);

    // clear element array
    for (var k=0; k < elements.length; k++) {
        elements[k] = null;
    }

    // fire 'notify' event
    this.trigger('form-submit-notify', [this, options]);
    return this;

    // utility fn for deep serialization
    function deepSerialize(extraData){
        var serialized = $.param(extraData, options.traditional).split('&');
        var len = serialized.length;
        var result = [];
        var i, part;
        for (i=0; i < len; i++) {
            // #252; undo param space replacement
            serialized[i] = serialized[i].replace(/\+/g,' ');
            part = serialized[i].split('=');
            // #278; use array instead of object storage, favoring array serializations
            result.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])]);
        }
        return result;
    }

     // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
    function fileUploadXhr(a) {
        var formdata = new FormData();

        for (var i=0; i < a.length; i++) {
            formdata.append(a[i].name, a[i].value);
        }

        if (options.extraData) {
            var serializedData = deepSerialize(options.extraData);
            for (i=0; i < serializedData.length; i++) {
                if (serializedData[i]) {
                    formdata.append(serializedData[i][0], serializedData[i][1]);
                }
            }
        }

        options.data = null;

        var s = $.extend(true, {}, $.ajaxSettings, options, {
            contentType: false,
            processData: false,
            cache: false,
            type: method || 'POST'
        });

        if (options.uploadProgress) {
            // workaround because jqXHR does not expose upload property
            s.xhr = function() {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position; /*event.position is deprecated*/
                        var total = event.total;
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                        }
                        options.uploadProgress(event, position, total, percent);
                    }, false);
                }
                return xhr;
            };
        }

        s.data = null;
        var beforeSend = s.beforeSend;
        s.beforeSend = function(xhr, o) {
            //Send FormData() provided by user
            if (options.formData) {
                o.data = options.formData;
            }
            else {
                o.data = formdata;
            }
            if(beforeSend) {
                beforeSend.call(this, xhr, o);
            }
        };
        return $.ajax(s);
    }

    // private function for handling file uploads (hat tip to YAHOO!)
    function fileUploadIframe(a) {
        var form = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
        var deferred = $.Deferred();

        // #341
        deferred.abort = function(status) {
            xhr.abort(status);
        };

        if (a) {
            // ensure that every serialized input is still enabled
            for (i=0; i < elements.length; i++) {
                el = $(elements[i]);
                if ( hasProp ) {
                    el.prop('disabled', false);
                }
                else {
                    el.removeAttr('disabled');
                }
            }
        }

        s = $.extend(true, {}, $.ajaxSettings, options);
        s.context = s.context || s;
        id = 'jqFormIO' + (new Date().getTime());
        if (s.iframeTarget) {
            $io = $(s.iframeTarget);
            n = $io.attr2('name');
            if (!n) {
                $io.attr2('name', id);
            }
            else {
                id = n;
            }
        }
        else {
            $io = $('<iframe name="' + id + '" src="'+ s.iframeSrc +'" />');
            $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });
        }
        io = $io[0];


        xhr = { // mock object
            aborted: 0,
            responseText: null,
            responseXML: null,
            status: 0,
            statusText: 'n/a',
            getAllResponseHeaders: function() {},
            getResponseHeader: function() {},
            setRequestHeader: function() {},
            abort: function(status) {
                var e = (status === 'timeout' ? 'timeout' : 'aborted');
                log('aborting upload... ' + e);
                this.aborted = 1;

                try { // #214, #257
                    if (io.contentWindow.document.execCommand) {
                        io.contentWindow.document.execCommand('Stop');
                    }
                }
                catch(ignore) {}

                $io.attr('src', s.iframeSrc); // abort op in progress
                xhr.error = e;
                if (s.error) {
                    s.error.call(s.context, xhr, e, status);
                }
                if (g) {
                    $.event.trigger("ajaxError", [xhr, s, e]);
                }
                if (s.complete) {
                    s.complete.call(s.context, xhr, e);
                }
            }
        };

        g = s.global;
        // trigger ajax global events so that activity/block indicators work like normal
        if (g && 0 === $.active++) {
            $.event.trigger("ajaxStart");
        }
        if (g) {
            $.event.trigger("ajaxSend", [xhr, s]);
        }

        if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
            if (s.global) {
                $.active--;
            }
            deferred.reject();
            return deferred;
        }
        if (xhr.aborted) {
            deferred.reject();
            return deferred;
        }

        // add submitting element to data if we know it
        sub = form.clk;
        if (sub) {
            n = sub.name;
            if (n && !sub.disabled) {
                s.extraData = s.extraData || {};
                s.extraData[n] = sub.value;
                if (sub.type == "image") {
                    s.extraData[n+'.x'] = form.clk_x;
                    s.extraData[n+'.y'] = form.clk_y;
                }
            }
        }

        var CLIENT_TIMEOUT_ABORT = 1;
        var SERVER_ABORT = 2;
                
        function getDoc(frame) {
            /* it looks like contentWindow or contentDocument do not
             * carry the protocol property in ie8, when running under ssl
             * frame.document is the only valid response document, since
             * the protocol is know but not on the other two objects. strange?
             * "Same origin policy" http://en.wikipedia.org/wiki/Same_origin_policy
             */
            
            var doc = null;
            
            // IE8 cascading access check
            try {
                if (frame.contentWindow) {
                    doc = frame.contentWindow.document;
                }
            } catch(err) {
                // IE8 access denied under ssl & missing protocol
                log('cannot get iframe.contentWindow document: ' + err);
            }

            if (doc) { // successful getting content
                return doc;
            }

            try { // simply checking may throw in ie8 under ssl or mismatched protocol
                doc = frame.contentDocument ? frame.contentDocument : frame.document;
            } catch(err) {
                // last attempt
                log('cannot get iframe.contentDocument: ' + err);
                doc = frame.document;
            }
            return doc;
        }

        // Rails CSRF hack (thanks to Yvan Barthelemy)
        var csrf_token = $('meta[name=csrf-token]').attr('content');
        var csrf_param = $('meta[name=csrf-param]').attr('content');
        if (csrf_param && csrf_token) {
            s.extraData = s.extraData || {};
            s.extraData[csrf_param] = csrf_token;
        }

        // take a breath so that pending repaints get some cpu time before the upload starts
        function doSubmit() {
            // make sure form attrs are set
            var t = $form.attr2('target'), 
                a = $form.attr2('action'), 
                mp = 'multipart/form-data',
                et = $form.attr('enctype') || $form.attr('encoding') || mp;

            // update form attrs in IE friendly way
            form.setAttribute('target',id);
            if (!method || /post/i.test(method) ) {
                form.setAttribute('method', 'POST');
            }
            if (a != s.url) {
                form.setAttribute('action', s.url);
            }

            // ie borks in some cases when setting encoding
            if (! s.skipEncodingOverride && (!method || /post/i.test(method))) {
                $form.attr({
                    encoding: 'multipart/form-data',
                    enctype:  'multipart/form-data'
                });
            }

            // support timout
            if (s.timeout) {
                timeoutHandle = setTimeout(function() { timedOut = true; cb(CLIENT_TIMEOUT_ABORT); }, s.timeout);
            }

            // look for server aborts
            function checkState() {
                try {
                    var state = getDoc(io).readyState;
                    log('state = ' + state);
                    if (state && state.toLowerCase() == 'uninitialized') {
                        setTimeout(checkState,50);
                    }
                }
                catch(e) {
                    log('Server abort: ' , e, ' (', e.name, ')');
                    cb(SERVER_ABORT);
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }
                    timeoutHandle = undefined;
                }
            }

            // add "extra" data to form if provided in options
            var extraInputs = [];
            try {
                if (s.extraData) {
                    for (var n in s.extraData) {
                        if (s.extraData.hasOwnProperty(n)) {
                           // if using the $.param format that allows for multiple values with the same name
                           if($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                               extraInputs.push(
                               $('<input type="hidden" name="'+s.extraData[n].name+'">').val(s.extraData[n].value)
                                   .appendTo(form)[0]);
                           } else {
                               extraInputs.push(
                               $('<input type="hidden" name="'+n+'">').val(s.extraData[n])
                                   .appendTo(form)[0]);
                           }
                        }
                    }
                }

                if (!s.iframeTarget) {
                    // add iframe to doc and submit the form
                    $io.appendTo('body');
                }
                if (io.attachEvent) {
                    io.attachEvent('onload', cb);
                }
                else {
                    io.addEventListener('load', cb, false);
                }
                setTimeout(checkState,15);

                try {
                    form.submit();
                } catch(err) {
                    // just in case form has element with name/id of 'submit'
                    var submitFn = document.createElement('form').submit;
                    submitFn.apply(form);
                }
            }
            finally {
                // reset attrs and remove "extra" input elements
                form.setAttribute('action',a);
                form.setAttribute('enctype', et); // #380
                if(t) {
                    form.setAttribute('target', t);
                } else {
                    $form.removeAttr('target');
                }
                $(extraInputs).remove();
            }
        }

        if (s.forceSync) {
            doSubmit();
        }
        else {
            setTimeout(doSubmit, 10); // this lets dom updates render
        }

        var data, doc, domCheckCount = 50, callbackProcessed;

        function cb(e) {
            if (xhr.aborted || callbackProcessed) {
                return;
            }
            
            doc = getDoc(io);
            if(!doc) {
                log('cannot access response document');
                e = SERVER_ABORT;
            }
            if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                xhr.abort('timeout');
                deferred.reject(xhr, 'timeout');
                return;
            }
            else if (e == SERVER_ABORT && xhr) {
                xhr.abort('server abort');
                deferred.reject(xhr, 'error', 'server abort');
                return;
            }

            if (!doc || doc.location.href == s.iframeSrc) {
                // response not received yet
                if (!timedOut) {
                    return;
                }
            }
            if (io.detachEvent) {
                io.detachEvent('onload', cb);
            }
            else {
                io.removeEventListener('load', cb, false);
            }

            var status = 'success', errMsg;
            try {
                if (timedOut) {
                    throw 'timeout';
                }

                var isXml = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                log('isXml='+isXml);
                if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                    if (--domCheckCount) {
                        // in some browsers (Opera) the iframe DOM is not always traversable when
                        // the onload callback fires, so we loop a bit to accommodate
                        log('requeing onLoad callback, DOM not available');
                        setTimeout(cb, 250);
                        return;
                    }
                    // let this fall through because server response could be an empty document
                    //log('Could not access iframe DOM after mutiple tries.');
                    //throw 'DOMException: not available';
                }

                //log('response detected');
                var docRoot = doc.body ? doc.body : doc.documentElement;
                xhr.responseText = docRoot ? docRoot.innerHTML : null;
                xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                if (isXml) {
                    s.dataType = 'xml';
                }
                xhr.getResponseHeader = function(header){
                    var headers = {'content-type': s.dataType};
                    return headers[header.toLowerCase()];
                };
                // support for XHR 'status' & 'statusText' emulation :
                if (docRoot) {
                    xhr.status = Number( docRoot.getAttribute('status') ) || xhr.status;
                    xhr.statusText = docRoot.getAttribute('statusText') || xhr.statusText;
                }

                var dt = (s.dataType || '').toLowerCase();
                var scr = /(json|script|text)/.test(dt);
                if (scr || s.textarea) {
                    // see if user embedded response in textarea
                    var ta = doc.getElementsByTagName('textarea')[0];
                    if (ta) {
                        xhr.responseText = ta.value;
                        // support for XHR 'status' & 'statusText' emulation :
                        xhr.status = Number( ta.getAttribute('status') ) || xhr.status;
                        xhr.statusText = ta.getAttribute('statusText') || xhr.statusText;
                    }
                    else if (scr) {
                        // account for browsers injecting pre around json response
                        var pre = doc.getElementsByTagName('pre')[0];
                        var b = doc.getElementsByTagName('body')[0];
                        if (pre) {
                            xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                        }
                        else if (b) {
                            xhr.responseText = b.textContent ? b.textContent : b.innerText;
                        }
                    }
                }
                else if (dt == 'xml' && !xhr.responseXML && xhr.responseText) {
                    xhr.responseXML = toXml(xhr.responseText);
                }

                try {
                    data = httpData(xhr, dt, s);
                }
                catch (err) {
                    status = 'parsererror';
                    xhr.error = errMsg = (err || status);
                }
            }
            catch (err) {
                log('error caught: ',err);
                status = 'error';
                xhr.error = errMsg = (err || status);
            }

            if (xhr.aborted) {
                log('upload aborted');
                status = null;
            }

            if (xhr.status) { // we've set xhr.status
                status = (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) ? 'success' : 'error';
            }

            // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
            if (status === 'success') {
                if (s.success) {
                    s.success.call(s.context, data, 'success', xhr);
                }
                deferred.resolve(xhr.responseText, 'success', xhr);
                if (g) {
                    $.event.trigger("ajaxSuccess", [xhr, s]);
                }
            }
            else if (status) {
                if (errMsg === undefined) {
                    errMsg = xhr.statusText;
                }
                if (s.error) {
                    s.error.call(s.context, xhr, status, errMsg);
                }
                deferred.reject(xhr, 'error', errMsg);
                if (g) {
                    $.event.trigger("ajaxError", [xhr, s, errMsg]);
                }
            }

            if (g) {
                $.event.trigger("ajaxComplete", [xhr, s]);
            }

            if (g && ! --$.active) {
                $.event.trigger("ajaxStop");
            }

            if (s.complete) {
                s.complete.call(s.context, xhr, status);
            }

            callbackProcessed = true;
            if (s.timeout) {
                clearTimeout(timeoutHandle);
            }

            // clean up
            setTimeout(function() {
                if (!s.iframeTarget) {
                    $io.remove();
                }
                else { //adding else to clean up existing iframe response.
                    $io.attr('src', s.iframeSrc);
                }
                xhr.responseXML = null;
            }, 100);
        }

        var toXml = $.parseXML || function(s, doc) { // use parseXML if available (jQuery 1.5+)
            if (window.ActiveXObject) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = 'false';
                doc.loadXML(s);
            }
            else {
                doc = (new DOMParser()).parseFromString(s, 'text/xml');
            }
            return (doc && doc.documentElement && doc.documentElement.nodeName != 'parsererror') ? doc : null;
        };
        var parseJSON = $.parseJSON || function(s) {
            /*jslint evil:true */
            return window['eval']('(' + s + ')');
        };

        var httpData = function( xhr, type, s ) { // mostly lifted from jq1.4.4

            var ct = xhr.getResponseHeader('content-type') || '',
                xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
                data = xml ? xhr.responseXML : xhr.responseText;

            if (xml && data.documentElement.nodeName === 'parsererror') {
                if ($.error) {
                    $.error('parsererror');
                }
            }
            if (s && s.dataFilter) {
                data = s.dataFilter(data, type);
            }
            if (typeof data === 'string') {
                if (type === 'json' || !type && ct.indexOf('json') >= 0) {
                    data = parseJSON(data);
                } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                    $.globalEval(data);
                }
            }
            return data;
        };

        return deferred;
    }
};

/**
 * ajaxForm() provides a mechanism for fully automating form submission.
 *
 * The advantages of using this method instead of ajaxSubmit() are:
 *
 * 1: This method will include coordinates for <input type="image" /> elements (if the element
 *    is used to submit the form).
 * 2. This method will include the submit element's name/value data (for the element that was
 *    used to submit the form).
 * 3. This method binds the submit() method to the form for you.
 *
 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
 * passes the options argument along after properly binding events for submit elements and
 * the form itself.
 */
$.fn.ajaxForm = function(options) {
    options = options || {};
    options.delegation = options.delegation && $.isFunction($.fn.on);

    // in jQuery 1.3+ we can fix mistakes with the ready state
    if (!options.delegation && this.length === 0) {
        var o = { s: this.selector, c: this.context };
        if (!$.isReady && o.s) {
            log('DOM not ready, queuing ajaxForm');
            $(function() {
                $(o.s,o.c).ajaxForm(options);
            });
            return this;
        }
        // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
        log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
        return this;
    }

    if ( options.delegation ) {
        $(document)
            .off('submit.form-plugin', this.selector, doAjaxSubmit)
            .off('click.form-plugin', this.selector, captureSubmittingElement)
            .on('submit.form-plugin', this.selector, options, doAjaxSubmit)
            .on('click.form-plugin', this.selector, options, captureSubmittingElement);
        return this;
    }

    return this.ajaxFormUnbind()
        .bind('submit.form-plugin', options, doAjaxSubmit)
        .bind('click.form-plugin', options, captureSubmittingElement);
};

// private event handlers
function doAjaxSubmit(e) {
    /*jshint validthis:true */
    var options = e.data;
    if (!e.isDefaultPrevented()) { // if event has been canceled, don't proceed
        e.preventDefault();
        $(e.target).ajaxSubmit(options); // #365
    }
}

function captureSubmittingElement(e) {
    /*jshint validthis:true */
    var target = e.target;
    var $el = $(target);
    if (!($el.is("[type=submit],[type=image]"))) {
        // is this a child element of the submit el?  (ex: a span within a button)
        var t = $el.closest('[type=submit]');
        if (t.length === 0) {
            return;
        }
        target = t[0];
    }
    var form = this;
    form.clk = target;
    if (target.type == 'image') {
        if (e.offsetX !== undefined) {
            form.clk_x = e.offsetX;
            form.clk_y = e.offsetY;
        } else if (typeof $.fn.offset == 'function') {
            var offset = $el.offset();
            form.clk_x = e.pageX - offset.left;
            form.clk_y = e.pageY - offset.top;
        } else {
            form.clk_x = e.pageX - target.offsetLeft;
            form.clk_y = e.pageY - target.offsetTop;
        }
    }
    // clear form vars
    setTimeout(function() { form.clk = form.clk_x = form.clk_y = null; }, 100);
}


// ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
$.fn.ajaxFormUnbind = function() {
    return this.unbind('submit.form-plugin click.form-plugin');
};

/**
 * formToArray() gathers form element data into an array of objects that can
 * be passed to any of the following ajax functions: $.get, $.post, or load.
 * Each object in the array has both a 'name' and 'value' property.  An example of
 * an array for a simple login form might be:
 *
 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
 *
 * It is this array that is passed to pre-submit callback functions provided to the
 * ajaxSubmit() and ajaxForm() methods.
 */
$.fn.formToArray = function(semantic, elements) {
    var a = [];
    if (this.length === 0) {
        return a;
    }

    var form = this[0];
    var formId = this.attr('id');
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    var els2;

    if (els && !/MSIE [678]/.test(navigator.userAgent)) { // #390
        els = $(els).get();  // convert to standard array
    }

    // #386; account for inputs outside the form which use the 'form' attribute
    if ( formId ) {
        els2 = $(':input[form="' + formId + '"]').get(); // hat tip @thet
        if ( els2.length ) {
            els = (els || []).concat(els2);
        }
    }

    if (!els || !els.length) {
        return a;
    }

    var i,j,n,v,el,max,jmax;
    for(i=0, max=els.length; i < max; i++) {
        el = els[i];
        n = el.name;
        if (!n || el.disabled) {
            continue;
        }

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(form.clk == el) {
                a.push({name: n, value: $(el).val(), type: el.type });
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            }
            continue;
        }

        v = $.fieldValue(el, true);
        if (v && v.constructor == Array) {
            if (elements) {
                elements.push(el);
            }
            for(j=0, jmax=v.length; j < jmax; j++) {
                a.push({name: n, value: v[j]});
            }
        }
        else if (feature.fileapi && el.type == 'file') {
            if (elements) {
                elements.push(el);
            }
            var files = el.files;
            if (files.length) {
                for (j=0; j < files.length; j++) {
                    a.push({name: n, value: files[j], type: el.type});
                }
            }
            else {
                // #180
                a.push({ name: n, value: '', type: el.type });
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            if (elements) {
                elements.push(el);
            }
            a.push({name: n, value: v, type: el.type, required: el.required});
        }
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle it here
        var $input = $(form.clk), input = $input[0];
        n = input.name;
        if (n && !input.disabled && input.type == 'image') {
            a.push({name: n, value: $input.val()});
            a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
    return a;
};

/**
 * Serializes form data into a 'submittable' string. This method will return a string
 * in the format: name1=value1&amp;name2=value2
 */
$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

/**
 * Serializes all field elements in the jQuery object into a query string.
 * This method will return a string in the format: name1=value1&amp;name2=value2
 */
$.fn.fieldSerialize = function(successful) {
    var a = [];
    this.each(function() {
        var n = this.name;
        if (!n) {
            return;
        }
        var v = $.fieldValue(this, successful);
        if (v && v.constructor == Array) {
            for (var i=0,max=v.length; i < max; i++) {
                a.push({name: n, value: v[i]});
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            a.push({name: this.name, value: v});
        }
    });
    //hand off to jQuery.param for proper encoding
    return $.param(a);
};

/**
 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
 *
 *  <form><fieldset>
 *      <input name="A" type="text" />
 *      <input name="A" type="text" />
 *      <input name="B" type="checkbox" value="B1" />
 *      <input name="B" type="checkbox" value="B2"/>
 *      <input name="C" type="radio" value="C1" />
 *      <input name="C" type="radio" value="C2" />
 *  </fieldset></form>
 *
 *  var v = $('input[type=text]').fieldValue();
 *  // if no values are entered into the text inputs
 *  v == ['','']
 *  // if values entered into the text inputs are 'foo' and 'bar'
 *  v == ['foo','bar']
 *
 *  var v = $('input[type=checkbox]').fieldValue();
 *  // if neither checkbox is checked
 *  v === undefined
 *  // if both checkboxes are checked
 *  v == ['B1', 'B2']
 *
 *  var v = $('input[type=radio]').fieldValue();
 *  // if neither radio is checked
 *  v === undefined
 *  // if first radio is checked
 *  v == ['C1']
 *
 * The successful argument controls whether or not the field element must be 'successful'
 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
 * The default value of the successful argument is true.  If this value is false the value(s)
 * for each element is returned.
 *
 * Note: This method *always* returns an array.  If no valid value can be determined the
 *    array will be empty, otherwise it will contain one or more values.
 */
$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length)) {
            continue;
        }
        if (v.constructor == Array) {
            $.merge(val, v);
        }
        else {
            val.push(v);
        }
    }
    return val;
};

/**
 * Returns the value of the field element.
 */
$.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (successful === undefined) {
        successful = true;
    }

    if (successful && (!n || el.disabled || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1)) {
            return null;
    }

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) {
            return null;
        }
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                var v = op.value;
                if (!v) { // extra pain for IE...
                    v = (op.attributes && op.attributes.value && !(op.attributes.value.specified)) ? op.text : op.value;
                }
                if (one) {
                    return v;
                }
                a.push(v);
            }
        }
        return a;
    }
    return $(el).val();
};

/**
 * Clears the form data.  Takes the following actions on the form's input fields:
 *  - input text fields will have their 'value' property set to the empty string
 *  - select elements will have their 'selectedIndex' property set to -1
 *  - checkbox and radio inputs will have their 'checked' property set to false
 *  - inputs of type submit, button, reset, and hidden will *not* be effected
 *  - button elements will *not* be effected
 */
$.fn.clearForm = function(includeHidden) {
    return this.each(function() {
        $('input,select,textarea', this).clearFields(includeHidden);
    });
};

/**
 * Clears the selected form elements.
 */
$.fn.clearFields = $.fn.clearInputs = function(includeHidden) {
    var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
    return this.each(function() {
        var t = this.type, tag = this.tagName.toLowerCase();
        if (re.test(t) || tag == 'textarea') {
            this.value = '';
        }
        else if (t == 'checkbox' || t == 'radio') {
            this.checked = false;
        }
        else if (tag == 'select') {
            this.selectedIndex = -1;
        }
        else if (t == "file") {
            if (/MSIE/.test(navigator.userAgent)) {
                $(this).replaceWith($(this).clone(true));
            } else {
                $(this).val('');
            }
        }
        else if (includeHidden) {
            // includeHidden can be the value true, or it can be a selector string
            // indicating a special test; for example:
            //  $('#myForm').clearForm('.special:hidden')
            // the above would clean hidden inputs that have the class of 'special'
            if ( (includeHidden === true && /hidden/.test(t)) ||
                 (typeof includeHidden == 'string' && $(this).is(includeHidden)) ) {
                this.value = '';
            }
        }
    });
};

/**
 * Resets the form data.  Causes all form elements to be reset to their original value.
 */
$.fn.resetForm = function() {
    return this.each(function() {
        // guard against an input with the name of 'reset'
        // note that IE reports the reset function as an 'object'
        if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType)) {
            this.reset();
        }
    });
};

/**
 * Enables or disables any matching elements.
 */
$.fn.enable = function(b) {
    if (b === undefined) {
        b = true;
    }
    return this.each(function() {
        this.disabled = !b;
    });
};

/**
 * Checks/unchecks any matching checkboxes or radio buttons and
 * selects/deselects and matching option elements.
 */
$.fn.selected = function(select) {
    if (select === undefined) {
        select = true;
    }
    return this.each(function() {
        var t = this.type;
        if (t == 'checkbox' || t == 'radio') {
            this.checked = select;
        }
        else if (this.tagName.toLowerCase() == 'option') {
            var $sel = $(this).parent('select');
            if (select && $sel[0] && $sel[0].type == 'select-one') {
                // deselect all other options
                $sel.find('option').selected(false);
            }
            this.selected = select;
        }
    });
};

// expose debug var
$.fn.ajaxSubmit.debug = false;

// helper fn for console logging
function log() {
    if (!$.fn.ajaxSubmit.debug) {
        return;
    }
    var msg = '[jquery.form] ' + Array.prototype.join.call(arguments,'');
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
    else if (window.opera && window.opera.postError) {
        window.opera.postError(msg);
    }
}

}));
/* @preserve
 * Leaflet 1.5.1+Detached: 2e3e0ffbe87f246eb76d86d2633ddd59b262830b.2e3e0ff, a JS library for interactive maps. http://leafletjs.com
 * (c) 2010-2018 Vladimir Agafonkin, (c) 2010-2011 CloudMade
 */

!function(t,i){"object"==typeof exports&&"undefined"!=typeof module?i(exports):"function"==typeof define&&define.amd?define(["exports"],i):i(t.L={})}(this,function(t){"use strict";var i=Object.freeze;function h(t){var i,e,n,o;for(e=1,n=arguments.length;e<n;e++)for(i in o=arguments[e])t[i]=o[i];return t}Object.freeze=function(t){return t};var s=Object.create||function(t){return e.prototype=t,new e};function e(){}function a(t,i){var e=Array.prototype.slice;if(t.bind)return t.bind.apply(t,e.call(arguments,1));var n=e.call(arguments,2);return function(){return t.apply(i,n.length?n.concat(e.call(arguments)):arguments)}}var n=0;function u(t){return t._leaflet_id=t._leaflet_id||++n,t._leaflet_id}function o(t,i,e){var n,o,s,r;return r=function(){n=!1,o&&(s.apply(e,o),o=!1)},s=function(){n?o=arguments:(t.apply(e,arguments),setTimeout(r,i),n=!0)}}function r(t,i,e){var n=i[1],o=i[0],s=n-o;return t===n&&e?t:((t-o)%s+s)%s+o}function l(){return!1}function c(t,i){return i=void 0===i?6:i,+(Math.round(t+"e+"+i)+"e-"+i)}function _(t){return t.trim?t.trim():t.replace(/^\s+|\s+$/g,"")}function d(t){return _(t).split(/\s+/)}function p(t,i){for(var e in t.hasOwnProperty("options")||(t.options=t.options?s(t.options):{}),i)t.options[e]=i[e];return t.options}function m(t,i,e){var n=[];for(var o in t)n.push(encodeURIComponent(e?o.toUpperCase():o)+"="+encodeURIComponent(t[o]));return(i&&-1!==i.indexOf("?")?"&":"?")+n.join("&")}var f=/\{ *([\w_-]+) *\}/g;function g(t,n){return t.replace(f,function(t,i){var e=n[i];if(void 0===e)throw new Error("No value provided for variable "+t);return"function"==typeof e&&(e=e(n)),e})}var v=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)};function y(t,i){for(var e=0;e<t.length;e++)if(t[e]===i)return e;return-1}var x="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";function w(t){return window["webkit"+t]||window["moz"+t]||window["ms"+t]}var P=0;function b(t){var i=+new Date,e=Math.max(0,16-(i-P));return P=i+e,window.setTimeout(t,e)}var T=window.requestAnimationFrame||w("RequestAnimationFrame")||b,z=window.cancelAnimationFrame||w("CancelAnimationFrame")||w("CancelRequestAnimationFrame")||function(t){window.clearTimeout(t)};function M(t,i,e){if(!e||T!==b)return T.call(window,a(t,i));t.call(i)}function C(t){t&&z.call(window,t)}var S=(Object.freeze||Object)({freeze:i,extend:h,create:s,bind:a,lastId:n,stamp:u,throttle:o,wrapNum:r,falseFn:l,formatNum:c,trim:_,splitWords:d,setOptions:p,getParamString:m,template:g,isArray:v,indexOf:y,emptyImageUrl:x,requestFn:T,cancelFn:z,requestAnimFrame:M,cancelAnimFrame:C});function Z(){}Z.extend=function(t){function i(){this.initialize&&this.initialize.apply(this,arguments),this.callInitHooks()}var e=i.__super__=this.prototype,n=s(e);for(var o in(n.constructor=i).prototype=n,this)this.hasOwnProperty(o)&&"prototype"!==o&&"__super__"!==o&&(i[o]=this[o]);return t.statics&&(h(i,t.statics),delete t.statics),t.includes&&(function(t){if("undefined"==typeof L||!L||!L.Mixin)return;t=v(t)?t:[t];for(var i=0;i<t.length;i++)t[i]===L.Mixin.Events&&console.warn("Deprecated include of L.Mixin.Events: this property will be removed in future releases, please inherit from L.Evented instead.",(new Error).stack)}(t.includes),h.apply(null,[n].concat(t.includes)),delete t.includes),n.options&&(t.options=h(s(n.options),t.options)),h(n,t),n._initHooks=[],n.callInitHooks=function(){if(!this._initHooksCalled){e.callInitHooks&&e.callInitHooks.call(this),this._initHooksCalled=!0;for(var t=0,i=n._initHooks.length;t<i;t++)n._initHooks[t].call(this)}},i},Z.include=function(t){return h(this.prototype,t),this},Z.mergeOptions=function(t){return h(this.prototype.options,t),this},Z.addInitHook=function(t){var i=Array.prototype.slice.call(arguments,1),e="function"==typeof t?t:function(){this[t].apply(this,i)};return this.prototype._initHooks=this.prototype._initHooks||[],this.prototype._initHooks.push(e),this};var E={on:function(t,i,e){if("object"==typeof t)for(var n in t)this._on(n,t[n],i);else for(var o=0,s=(t=d(t)).length;o<s;o++)this._on(t[o],i,e);return this},off:function(t,i,e){if(t)if("object"==typeof t)for(var n in t)this._off(n,t[n],i);else for(var o=0,s=(t=d(t)).length;o<s;o++)this._off(t[o],i,e);else delete this._events;return this},_on:function(t,i,e){this._events=this._events||{};var n=this._events[t];n||(n=[],this._events[t]=n),e===this&&(e=void 0);for(var o={fn:i,ctx:e},s=n,r=0,a=s.length;r<a;r++)if(s[r].fn===i&&s[r].ctx===e)return;s.push(o)},_off:function(t,i,e){var n,o,s;if(this._events&&(n=this._events[t]))if(i){if(e===this&&(e=void 0),n)for(o=0,s=n.length;o<s;o++){var r=n[o];if(r.ctx===e&&r.fn===i)return r.fn=l,this._firingCount&&(this._events[t]=n=n.slice()),void n.splice(o,1)}}else{for(o=0,s=n.length;o<s;o++)n[o].fn=l;delete this._events[t]}},fire:function(t,i,e){if(!this.listens(t,e))return this;var n=h({},i,{type:t,target:this,sourceTarget:i&&i.sourceTarget||this});if(this._events){var o=this._events[t];if(o){this._firingCount=this._firingCount+1||1;for(var s=0,r=o.length;s<r;s++){var a=o[s];a.fn.call(a.ctx||this,n)}this._firingCount--}}return e&&this._propagateEvent(n),this},listens:function(t,i){var e=this._events&&this._events[t];if(e&&e.length)return!0;if(i)for(var n in this._eventParents)if(this._eventParents[n].listens(t,i))return!0;return!1},once:function(t,i,e){if("object"==typeof t){for(var n in t)this.once(n,t[n],i);return this}var o=a(function(){this.off(t,i,e).off(t,o,e)},this);return this.on(t,i,e).on(t,o,e)},addEventParent:function(t){return this._eventParents=this._eventParents||{},this._eventParents[u(t)]=t,this},removeEventParent:function(t){return this._eventParents&&delete this._eventParents[u(t)],this},_propagateEvent:function(t){for(var i in this._eventParents)this._eventParents[i].fire(t.type,h({layer:t.target,propagatedFrom:t.target},t),!0)}};E.addEventListener=E.on,E.removeEventListener=E.clearAllEventListeners=E.off,E.addOneTimeEventListener=E.once,E.fireEvent=E.fire,E.hasEventListeners=E.listens;var k=Z.extend(E);function B(t,i,e){this.x=e?Math.round(t):t,this.y=e?Math.round(i):i}var A=Math.trunc||function(t){return 0<t?Math.floor(t):Math.ceil(t)};function I(t,i,e){return t instanceof B?t:v(t)?new B(t[0],t[1]):null==t?t:"object"==typeof t&&"x"in t&&"y"in t?new B(t.x,t.y):new B(t,i,e)}function O(t,i){if(t)for(var e=i?[t,i]:t,n=0,o=e.length;n<o;n++)this.extend(e[n])}function R(t,i){return!t||t instanceof O?t:new O(t,i)}function N(t,i){if(t)for(var e=i?[t,i]:t,n=0,o=e.length;n<o;n++)this.extend(e[n])}function D(t,i){return t instanceof N?t:new N(t,i)}function j(t,i,e){if(isNaN(t)||isNaN(i))throw new Error("Invalid LatLng object: ("+t+", "+i+")");this.lat=+t,this.lng=+i,void 0!==e&&(this.alt=+e)}function W(t,i,e){return t instanceof j?t:v(t)&&"object"!=typeof t[0]?3===t.length?new j(t[0],t[1],t[2]):2===t.length?new j(t[0],t[1]):null:null==t?t:"object"==typeof t&&"lat"in t?new j(t.lat,"lng"in t?t.lng:t.lon,t.alt):void 0===i?null:new j(t,i,e)}B.prototype={clone:function(){return new B(this.x,this.y)},add:function(t){return this.clone()._add(I(t))},_add:function(t){return this.x+=t.x,this.y+=t.y,this},subtract:function(t){return this.clone()._subtract(I(t))},_subtract:function(t){return this.x-=t.x,this.y-=t.y,this},divideBy:function(t){return this.clone()._divideBy(t)},_divideBy:function(t){return this.x/=t,this.y/=t,this},multiplyBy:function(t){return this.clone()._multiplyBy(t)},_multiplyBy:function(t){return this.x*=t,this.y*=t,this},scaleBy:function(t){return new B(this.x*t.x,this.y*t.y)},unscaleBy:function(t){return new B(this.x/t.x,this.y/t.y)},round:function(){return this.clone()._round()},_round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},floor:function(){return this.clone()._floor()},_floor:function(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this},ceil:function(){return this.clone()._ceil()},_ceil:function(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this},trunc:function(){return this.clone()._trunc()},_trunc:function(){return this.x=A(this.x),this.y=A(this.y),this},distanceTo:function(t){var i=(t=I(t)).x-this.x,e=t.y-this.y;return Math.sqrt(i*i+e*e)},equals:function(t){return(t=I(t)).x===this.x&&t.y===this.y},contains:function(t){return t=I(t),Math.abs(t.x)<=Math.abs(this.x)&&Math.abs(t.y)<=Math.abs(this.y)},toString:function(){return"Point("+c(this.x)+", "+c(this.y)+")"}},O.prototype={extend:function(t){return t=I(t),this.min||this.max?(this.min.x=Math.min(t.x,this.min.x),this.max.x=Math.max(t.x,this.max.x),this.min.y=Math.min(t.y,this.min.y),this.max.y=Math.max(t.y,this.max.y)):(this.min=t.clone(),this.max=t.clone()),this},getCenter:function(t){return new B((this.min.x+this.max.x)/2,(this.min.y+this.max.y)/2,t)},getBottomLeft:function(){return new B(this.min.x,this.max.y)},getTopRight:function(){return new B(this.max.x,this.min.y)},getTopLeft:function(){return this.min},getBottomRight:function(){return this.max},getSize:function(){return this.max.subtract(this.min)},contains:function(t){var i,e;return(t="number"==typeof t[0]||t instanceof B?I(t):R(t))instanceof O?(i=t.min,e=t.max):i=e=t,i.x>=this.min.x&&e.x<=this.max.x&&i.y>=this.min.y&&e.y<=this.max.y},intersects:function(t){t=R(t);var i=this.min,e=this.max,n=t.min,o=t.max,s=o.x>=i.x&&n.x<=e.x,r=o.y>=i.y&&n.y<=e.y;return s&&r},overlaps:function(t){t=R(t);var i=this.min,e=this.max,n=t.min,o=t.max,s=o.x>i.x&&n.x<e.x,r=o.y>i.y&&n.y<e.y;return s&&r},isValid:function(){return!(!this.min||!this.max)}},N.prototype={extend:function(t){var i,e,n=this._southWest,o=this._northEast;if(t instanceof j)e=i=t;else{if(!(t instanceof N))return t?this.extend(W(t)||D(t)):this;if(i=t._southWest,e=t._northEast,!i||!e)return this}return n||o?(n.lat=Math.min(i.lat,n.lat),n.lng=Math.min(i.lng,n.lng),o.lat=Math.max(e.lat,o.lat),o.lng=Math.max(e.lng,o.lng)):(this._southWest=new j(i.lat,i.lng),this._northEast=new j(e.lat,e.lng)),this},pad:function(t){var i=this._southWest,e=this._northEast,n=Math.abs(i.lat-e.lat)*t,o=Math.abs(i.lng-e.lng)*t;return new N(new j(i.lat-n,i.lng-o),new j(e.lat+n,e.lng+o))},getCenter:function(){return new j((this._southWest.lat+this._northEast.lat)/2,(this._southWest.lng+this._northEast.lng)/2)},getSouthWest:function(){return this._southWest},getNorthEast:function(){return this._northEast},getNorthWest:function(){return new j(this.getNorth(),this.getWest())},getSouthEast:function(){return new j(this.getSouth(),this.getEast())},getWest:function(){return this._southWest.lng},getSouth:function(){return this._southWest.lat},getEast:function(){return this._northEast.lng},getNorth:function(){return this._northEast.lat},contains:function(t){t="number"==typeof t[0]||t instanceof j||"lat"in t?W(t):D(t);var i,e,n=this._southWest,o=this._northEast;return t instanceof N?(i=t.getSouthWest(),e=t.getNorthEast()):i=e=t,i.lat>=n.lat&&e.lat<=o.lat&&i.lng>=n.lng&&e.lng<=o.lng},intersects:function(t){t=D(t);var i=this._southWest,e=this._northEast,n=t.getSouthWest(),o=t.getNorthEast(),s=o.lat>=i.lat&&n.lat<=e.lat,r=o.lng>=i.lng&&n.lng<=e.lng;return s&&r},overlaps:function(t){t=D(t);var i=this._southWest,e=this._northEast,n=t.getSouthWest(),o=t.getNorthEast(),s=o.lat>i.lat&&n.lat<e.lat,r=o.lng>i.lng&&n.lng<e.lng;return s&&r},toBBoxString:function(){return[this.getWest(),this.getSouth(),this.getEast(),this.getNorth()].join(",")},equals:function(t,i){return!!t&&(t=D(t),this._southWest.equals(t.getSouthWest(),i)&&this._northEast.equals(t.getNorthEast(),i))},isValid:function(){return!(!this._southWest||!this._northEast)}};var H,F={latLngToPoint:function(t,i){var e=this.projection.project(t),n=this.scale(i);return this.transformation._transform(e,n)},pointToLatLng:function(t,i){var e=this.scale(i),n=this.transformation.untransform(t,e);return this.projection.unproject(n)},project:function(t){return this.projection.project(t)},unproject:function(t){return this.projection.unproject(t)},scale:function(t){return 256*Math.pow(2,t)},zoom:function(t){return Math.log(t/256)/Math.LN2},getProjectedBounds:function(t){if(this.infinite)return null;var i=this.projection.bounds,e=this.scale(t);return new O(this.transformation.transform(i.min,e),this.transformation.transform(i.max,e))},infinite:!(j.prototype={equals:function(t,i){return!!t&&(t=W(t),Math.max(Math.abs(this.lat-t.lat),Math.abs(this.lng-t.lng))<=(void 0===i?1e-9:i))},toString:function(t){return"LatLng("+c(this.lat,t)+", "+c(this.lng,t)+")"},distanceTo:function(t){return U.distance(this,W(t))},wrap:function(){return U.wrapLatLng(this)},toBounds:function(t){var i=180*t/40075017,e=i/Math.cos(Math.PI/180*this.lat);return D([this.lat-i,this.lng-e],[this.lat+i,this.lng+e])},clone:function(){return new j(this.lat,this.lng,this.alt)}}),wrapLatLng:function(t){var i=this.wrapLng?r(t.lng,this.wrapLng,!0):t.lng;return new j(this.wrapLat?r(t.lat,this.wrapLat,!0):t.lat,i,t.alt)},wrapLatLngBounds:function(t){var i=t.getCenter(),e=this.wrapLatLng(i),n=i.lat-e.lat,o=i.lng-e.lng;if(0==n&&0==o)return t;var s=t.getSouthWest(),r=t.getNorthEast();return new N(new j(s.lat-n,s.lng-o),new j(r.lat-n,r.lng-o))}},U=h({},F,{wrapLng:[-180,180],R:6371e3,distance:function(t,i){var e=Math.PI/180,n=t.lat*e,o=i.lat*e,s=Math.sin((i.lat-t.lat)*e/2),r=Math.sin((i.lng-t.lng)*e/2),a=s*s+Math.cos(n)*Math.cos(o)*r*r,h=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));return this.R*h}}),V=6378137,q={R:V,MAX_LATITUDE:85.0511287798,project:function(t){var i=Math.PI/180,e=this.MAX_LATITUDE,n=Math.max(Math.min(e,t.lat),-e),o=Math.sin(n*i);return new B(this.R*t.lng*i,this.R*Math.log((1+o)/(1-o))/2)},unproject:function(t){var i=180/Math.PI;return new j((2*Math.atan(Math.exp(t.y/this.R))-Math.PI/2)*i,t.x*i/this.R)},bounds:(H=V*Math.PI,new O([-H,-H],[H,H]))};function G(t,i,e,n){if(v(t))return this._a=t[0],this._b=t[1],this._c=t[2],void(this._d=t[3]);this._a=t,this._b=i,this._c=e,this._d=n}function K(t,i,e,n){return new G(t,i,e,n)}G.prototype={transform:function(t,i){return this._transform(t.clone(),i)},_transform:function(t,i){return i=i||1,t.x=i*(this._a*t.x+this._b),t.y=i*(this._c*t.y+this._d),t},untransform:function(t,i){return i=i||1,new B((t.x/i-this._b)/this._a,(t.y/i-this._d)/this._c)}};var Y,X=h({},U,{code:"EPSG:3857",projection:q,transformation:(Y=.5/(Math.PI*q.R),K(Y,.5,-Y,.5))}),J=h({},X,{code:"EPSG:900913"});function $(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function Q(t,i){var e,n,o,s,r,a,h="";for(e=0,o=t.length;e<o;e++){for(n=0,s=(r=t[e]).length;n<s;n++)h+=(n?"L":"M")+(a=r[n]).x+" "+a.y;h+=i?Zt?"z":"x":""}return h||"M0 0"}var tt=document.documentElement.style,it="ActiveXObject"in window,et=it&&!document.addEventListener,nt="msLaunchUri"in navigator&&!("documentMode"in document),ot=kt("webkit"),st=kt("android"),rt=kt("android 2")||kt("android 3"),at=parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1],10),ht=st&&kt("Google")&&at<537&&!("AudioNode"in window),ut=!!window.opera,lt=kt("chrome"),ct=kt("gecko")&&!ot&&!ut&&!it,_t=!lt&&kt("safari"),dt=kt("phantom"),pt="OTransition"in tt,mt=0===navigator.platform.indexOf("Win"),ft=it&&"transition"in tt,gt="WebKitCSSMatrix"in window&&"m11"in new window.WebKitCSSMatrix&&!rt,vt="MozPerspective"in tt,yt=!window.L_DISABLE_3D&&(ft||gt||vt)&&!pt&&!dt,xt="undefined"!=typeof orientation||kt("mobile"),wt=xt&&ot,Pt=xt&&gt,Lt=!window.PointerEvent&&window.MSPointerEvent,bt=!(!window.PointerEvent&&!Lt),Tt=!window.L_NO_TOUCH&&(bt||"ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch),zt=xt&&ut,Mt=xt&&ct,Ct=1<(window.devicePixelRatio||window.screen.deviceXDPI/window.screen.logicalXDPI),St=!!document.createElement("canvas").getContext,Zt=!(!document.createElementNS||!$("svg").createSVGRect),Et=!Zt&&function(){try{var t=document.createElement("div");t.innerHTML='<v:shape adj="1"/>';var i=t.firstChild;return i.style.behavior="url(#default#VML)",i&&"object"==typeof i.adj}catch(t){return!1}}();function kt(t){return 0<=navigator.userAgent.toLowerCase().indexOf(t)}var Bt=(Object.freeze||Object)({ie:it,ielt9:et,edge:nt,webkit:ot,android:st,android23:rt,androidStock:ht,opera:ut,chrome:lt,gecko:ct,safari:_t,phantom:dt,opera12:pt,win:mt,ie3d:ft,webkit3d:gt,gecko3d:vt,any3d:yt,mobile:xt,mobileWebkit:wt,mobileWebkit3d:Pt,msPointer:Lt,pointer:bt,touch:Tt,mobileOpera:zt,mobileGecko:Mt,retina:Ct,canvas:St,svg:Zt,vml:Et}),At=Lt?"MSPointerDown":"pointerdown",It=Lt?"MSPointerMove":"pointermove",Ot=Lt?"MSPointerUp":"pointerup",Rt=Lt?"MSPointerCancel":"pointercancel",Nt=["INPUT","SELECT","OPTION"],Dt={},jt=!1,Wt=0;function Ht(t,i,e,n){return"touchstart"===i?function(t,i,e){var n=a(function(t){if("mouse"!==t.pointerType&&t.MSPOINTER_TYPE_MOUSE&&t.pointerType!==t.MSPOINTER_TYPE_MOUSE){if(!(Nt.indexOf(t.target.tagName)<0))return;Di(t)}qt(t,i)});t["_leaflet_touchstart"+e]=n,t.addEventListener(At,n,!1),jt||(document.documentElement.addEventListener(At,Ft,!0),document.documentElement.addEventListener(It,Ut,!0),document.documentElement.addEventListener(Ot,Vt,!0),document.documentElement.addEventListener(Rt,Vt,!0),jt=!0)}(t,e,n):"touchmove"===i?function(t,i,e){var n=function(t){(t.pointerType!==t.MSPOINTER_TYPE_MOUSE&&"mouse"!==t.pointerType||0!==t.buttons)&&qt(t,i)};t["_leaflet_touchmove"+e]=n,t.addEventListener(It,n,!1)}(t,e,n):"touchend"===i&&function(t,i,e){var n=function(t){qt(t,i)};t["_leaflet_touchend"+e]=n,t.addEventListener(Ot,n,!1),t.addEventListener(Rt,n,!1)}(t,e,n),this}function Ft(t){Dt[t.pointerId]=t,Wt++}function Ut(t){Dt[t.pointerId]&&(Dt[t.pointerId]=t)}function Vt(t){delete Dt[t.pointerId],Wt--}function qt(t,i){for(var e in t.touches=[],Dt)t.touches.push(Dt[e]);t.changedTouches=[t],i(t)}var Gt=Lt?"MSPointerDown":bt?"pointerdown":"touchstart",Kt=Lt?"MSPointerUp":bt?"pointerup":"touchend",Yt="_leaflet_";function Xt(t,o,i){var s,r,a=!1;function e(t){var i;if(bt){if(!nt||"mouse"===t.pointerType)return;i=Wt}else i=t.touches.length;if(!(1<i)){var e=Date.now(),n=e-(s||e);r=t.touches?t.touches[0]:t,a=0<n&&n<=250,s=e}}function n(t){if(a&&!r.cancelBubble){if(bt){if(!nt||"mouse"===t.pointerType)return;var i,e,n={};for(e in r)i=r[e],n[e]=i&&i.bind?i.bind(r):i;r=n}r.type="dblclick",r.button=0,o(r),s=null}}return t[Yt+Gt+i]=e,t[Yt+Kt+i]=n,t[Yt+"dblclick"+i]=o,t.addEventListener(Gt,e,!1),t.addEventListener(Kt,n,!1),t.addEventListener("dblclick",o,!1),this}function Jt(t,i){var e=t[Yt+Gt+i],n=t[Yt+Kt+i],o=t[Yt+"dblclick"+i];return t.removeEventListener(Gt,e,!1),t.removeEventListener(Kt,n,!1),nt||t.removeEventListener("dblclick",o,!1),this}var $t,Qt,ti,ii,ei,ni=yi(["transform","webkitTransform","OTransform","MozTransform","msTransform"]),oi=yi(["webkitTransition","transition","OTransition","MozTransition","msTransition"]),si="webkitTransition"===oi||"OTransition"===oi?oi+"End":"transitionend";function ri(t){return"string"==typeof t?document.getElementById(t):t}function ai(t,i){var e=t.style[i]||t.currentStyle&&t.currentStyle[i];if((!e||"auto"===e)&&document.defaultView){var n=document.defaultView.getComputedStyle(t,null);e=n?n[i]:null}return"auto"===e?null:e}function hi(t,i,e){var n=document.createElement(t);return n.className=i||"",e&&e.appendChild(n),n}function ui(t){var i=t.parentNode;i&&i.removeChild(t)}function li(t){for(;t.firstChild;)t.removeChild(t.firstChild)}function ci(t){var i=t.parentNode;i&&i.lastChild!==t&&i.appendChild(t)}function _i(t){var i=t.parentNode;i&&i.firstChild!==t&&i.insertBefore(t,i.firstChild)}function di(t,i){if(void 0!==t.classList)return t.classList.contains(i);var e=gi(t);return 0<e.length&&new RegExp("(^|\\s)"+i+"(\\s|$)").test(e)}function pi(t,i){if(void 0!==t.classList)for(var e=d(i),n=0,o=e.length;n<o;n++)t.classList.add(e[n]);else if(!di(t,i)){var s=gi(t);fi(t,(s?s+" ":"")+i)}}function mi(t,i){void 0!==t.classList?t.classList.remove(i):fi(t,_((" "+gi(t)+" ").replace(" "+i+" "," ")))}function fi(t,i){void 0===t.className.baseVal?t.className=i:t.className.baseVal=i}function gi(t){return t.correspondingElement&&(t=t.correspondingElement),void 0===t.className.baseVal?t.className:t.className.baseVal}function vi(t,i){"opacity"in t.style?t.style.opacity=i:"filter"in t.style&&function(t,i){var e=!1,n="DXImageTransform.Microsoft.Alpha";try{e=t.filters.item(n)}catch(t){if(1===i)return}i=Math.round(100*i),e?(e.Enabled=100!==i,e.Opacity=i):t.style.filter+=" progid:"+n+"(opacity="+i+")"}(t,i)}function yi(t){for(var i=document.documentElement.style,e=0;e<t.length;e++)if(t[e]in i)return t[e];return!1}function xi(t,i,e){var n=i||new B(0,0);t.style[ni]=(ft?"translate("+n.x+"px,"+n.y+"px)":"translate3d("+n.x+"px,"+n.y+"px,0)")+(e?" scale("+e+")":"")}function wi(t,i){t._leaflet_pos=i,yt?xi(t,i):(t.style.left=i.x+"px",t.style.top=i.y+"px")}function Pi(t){return t._leaflet_pos||new B(0,0)}if("onselectstart"in document)$t=function(){Ei(window,"selectstart",Di)},Qt=function(){Bi(window,"selectstart",Di)};else{var Li=yi(["userSelect","WebkitUserSelect","OUserSelect","MozUserSelect","msUserSelect"]);$t=function(){if(Li){var t=document.documentElement.style;ti=t[Li],t[Li]="none"}},Qt=function(){Li&&(document.documentElement.style[Li]=ti,ti=void 0)}}function bi(){Ei(window,"dragstart",Di)}function Ti(){Bi(window,"dragstart",Di)}function zi(t){for(;-1===t.tabIndex;)t=t.parentNode;t.style&&(Mi(),ei=(ii=t).style.outline,t.style.outline="none",Ei(window,"keydown",Mi))}function Mi(){ii&&(ii.style.outline=ei,ei=ii=void 0,Bi(window,"keydown",Mi))}function Ci(t){for(;!((t=t.parentNode).offsetWidth&&t.offsetHeight||t===document.body););return t}function Si(t){var i=t.getBoundingClientRect();return{x:i.width/t.offsetWidth||1,y:i.height/t.offsetHeight||1,boundingClientRect:i}}var Zi=(Object.freeze||Object)({TRANSFORM:ni,TRANSITION:oi,TRANSITION_END:si,get:ri,getStyle:ai,create:hi,remove:ui,empty:li,toFront:ci,toBack:_i,hasClass:di,addClass:pi,removeClass:mi,setClass:fi,getClass:gi,setOpacity:vi,testProp:yi,setTransform:xi,setPosition:wi,getPosition:Pi,disableTextSelection:$t,enableTextSelection:Qt,disableImageDrag:bi,enableImageDrag:Ti,preventOutline:zi,restoreOutline:Mi,getSizedParentNode:Ci,getScale:Si});function Ei(t,i,e,n){if("object"==typeof i)for(var o in i)Ai(t,o,i[o],e);else for(var s=0,r=(i=d(i)).length;s<r;s++)Ai(t,i[s],e,n);return this}var ki="_leaflet_events";function Bi(t,i,e,n){if("object"==typeof i)for(var o in i)Ii(t,o,i[o],e);else if(i)for(var s=0,r=(i=d(i)).length;s<r;s++)Ii(t,i[s],e,n);else{for(var a in t[ki])Ii(t,a,t[ki][a]);delete t[ki]}return this}function Ai(i,t,e,n){var o=t+u(e)+(n?"_"+u(n):"");if(i[ki]&&i[ki][o])return this;var s=function(t){return e.call(n||i,t||window.event)},r=s;bt&&0===t.indexOf("touch")?Ht(i,t,s,o):!Tt||"dblclick"!==t||bt&&lt?"addEventListener"in i?"mousewheel"===t?i.addEventListener("onwheel"in i?"wheel":"mousewheel",s,!1):"mouseenter"===t||"mouseleave"===t?(s=function(t){t=t||window.event,Ki(i,t)&&r(t)},i.addEventListener("mouseenter"===t?"mouseover":"mouseout",s,!1)):("click"===t&&st&&(s=function(t){!function(t,i){var e=t.timeStamp||t.originalEvent&&t.originalEvent.timeStamp,n=Ui&&e-Ui;if(n&&100<n&&n<500||t.target._simulatedClick&&!t._simulated)return ji(t);Ui=e,i(t)}(t,r)}),i.addEventListener(t,s,!1)):"attachEvent"in i&&i.attachEvent("on"+t,s):Xt(i,s,o),i[ki]=i[ki]||{},i[ki][o]=s}function Ii(t,i,e,n){var o=i+u(e)+(n?"_"+u(n):""),s=t[ki]&&t[ki][o];if(!s)return this;bt&&0===i.indexOf("touch")?function(t,i,e){var n=t["_leaflet_"+i+e];"touchstart"===i?t.removeEventListener(At,n,!1):"touchmove"===i?t.removeEventListener(It,n,!1):"touchend"===i&&(t.removeEventListener(Ot,n,!1),t.removeEventListener(Rt,n,!1))}(t,i,o):!Tt||"dblclick"!==i||bt&&lt?"removeEventListener"in t?"mousewheel"===i?t.removeEventListener("onwheel"in t?"wheel":"mousewheel",s,!1):t.removeEventListener("mouseenter"===i?"mouseover":"mouseleave"===i?"mouseout":i,s,!1):"detachEvent"in t&&t.detachEvent("on"+i,s):Jt(t,o),t[ki][o]=null}function Oi(t){return t.stopPropagation?t.stopPropagation():t.originalEvent?t.originalEvent._stopped=!0:t.cancelBubble=!0,Gi(t),this}function Ri(t){return Ai(t,"mousewheel",Oi),this}function Ni(t){return Ei(t,"mousedown touchstart dblclick",Oi),Ai(t,"click",qi),this}function Di(t){return t.preventDefault?t.preventDefault():t.returnValue=!1,this}function ji(t){return Di(t),Oi(t),this}function Wi(t,i){if(!i)return new B(t.clientX,t.clientY);var e=Si(i),n=e.boundingClientRect;return new B((t.clientX-n.left)/e.x-i.clientLeft,(t.clientY-n.top)/e.y-i.clientTop)}var Hi=mt&&lt?2*window.devicePixelRatio:ct?window.devicePixelRatio:1;function Fi(t){return nt?t.wheelDeltaY/2:t.deltaY&&0===t.deltaMode?-t.deltaY/Hi:t.deltaY&&1===t.deltaMode?20*-t.deltaY:t.deltaY&&2===t.deltaMode?60*-t.deltaY:t.deltaX||t.deltaZ?0:t.wheelDelta?(t.wheelDeltaY||t.wheelDelta)/2:t.detail&&Math.abs(t.detail)<32765?20*-t.detail:t.detail?t.detail/-32765*60:0}var Ui,Vi={};function qi(t){Vi[t.type]=!0}function Gi(t){var i=Vi[t.type];return Vi[t.type]=!1,i}function Ki(t,i){var e=i.relatedTarget;if(!e)return!0;try{for(;e&&e!==t;)e=e.parentNode}catch(t){return!1}return e!==t}var Yi=(Object.freeze||Object)({on:Ei,off:Bi,stopPropagation:Oi,disableScrollPropagation:Ri,disableClickPropagation:Ni,preventDefault:Di,stop:ji,getMousePosition:Wi,getWheelDelta:Fi,fakeStop:qi,skipped:Gi,isExternalTarget:Ki,addListener:Ei,removeListener:Bi}),Xi=k.extend({run:function(t,i,e,n){this.stop(),this._el=t,this._inProgress=!0,this._duration=e||.25,this._easeOutPower=1/Math.max(n||.5,.2),this._startPos=Pi(t),this._offset=i.subtract(this._startPos),this._startTime=+new Date,this.fire("start"),this._animate()},stop:function(){this._inProgress&&(this._step(!0),this._complete())},_animate:function(){this._animId=M(this._animate,this),this._step()},_step:function(t){var i=+new Date-this._startTime,e=1e3*this._duration;i<e?this._runFrame(this._easeOut(i/e),t):(this._runFrame(1),this._complete())},_runFrame:function(t,i){var e=this._startPos.add(this._offset.multiplyBy(t));i&&e._round(),wi(this._el,e),this.fire("step")},_complete:function(){C(this._animId),this._inProgress=!1,this.fire("end")},_easeOut:function(t){return 1-Math.pow(1-t,this._easeOutPower)}}),Ji=k.extend({options:{crs:X,center:void 0,zoom:void 0,minZoom:void 0,maxZoom:void 0,layers:[],maxBounds:void 0,renderer:void 0,zoomAnimation:!0,zoomAnimationThreshold:4,fadeAnimation:!0,markerZoomAnimation:!0,transform3DLimit:8388608,zoomSnap:1,zoomDelta:1,trackResize:!0},initialize:function(t,i){i=p(this,i),this._handlers=[],this._layers={},this._zoomBoundLayers={},this._sizeChanged=!0,this._initContainer(t),this._initLayout(),this._onResize=a(this._onResize,this),this._initEvents(),i.maxBounds&&this.setMaxBounds(i.maxBounds),void 0!==i.zoom&&(this._zoom=this._limitZoom(i.zoom)),i.center&&void 0!==i.zoom&&this.setView(W(i.center),i.zoom,{reset:!0}),this.callInitHooks(),this._zoomAnimated=oi&&yt&&!zt&&this.options.zoomAnimation,this._zoomAnimated&&(this._createAnimProxy(),Ei(this._proxy,si,this._catchTransitionEnd,this)),this._addLayers(this.options.layers)},setView:function(t,i,e){if((i=void 0===i?this._zoom:this._limitZoom(i),t=this._limitCenter(W(t),i,this.options.maxBounds),e=e||{},this._stop(),this._loaded&&!e.reset&&!0!==e)&&(void 0!==e.animate&&(e.zoom=h({animate:e.animate},e.zoom),e.pan=h({animate:e.animate,duration:e.duration},e.pan)),this._zoom!==i?this._tryAnimatedZoom&&this._tryAnimatedZoom(t,i,e.zoom):this._tryAnimatedPan(t,e.pan)))return clearTimeout(this._sizeTimer),this;return this._resetView(t,i),this},setZoom:function(t,i){return this._loaded?this.setView(this.getCenter(),t,{zoom:i}):(this._zoom=t,this)},zoomIn:function(t,i){return t=t||(yt?this.options.zoomDelta:1),this.setZoom(this._zoom+t,i)},zoomOut:function(t,i){return t=t||(yt?this.options.zoomDelta:1),this.setZoom(this._zoom-t,i)},setZoomAround:function(t,i,e){var n=this.getZoomScale(i),o=this.getSize().divideBy(2),s=(t instanceof B?t:this.latLngToContainerPoint(t)).subtract(o).multiplyBy(1-1/n),r=this.containerPointToLatLng(o.add(s));return this.setView(r,i,{zoom:e})},_getBoundsCenterZoom:function(t,i){i=i||{},t=t.getBounds?t.getBounds():D(t);var e=I(i.paddingTopLeft||i.padding||[0,0]),n=I(i.paddingBottomRight||i.padding||[0,0]),o=this.getBoundsZoom(t,!1,e.add(n));if((o="number"==typeof i.maxZoom?Math.min(i.maxZoom,o):o)===1/0)return{center:t.getCenter(),zoom:o};var s=n.subtract(e).divideBy(2),r=this.project(t.getSouthWest(),o),a=this.project(t.getNorthEast(),o);return{center:this.unproject(r.add(a).divideBy(2).add(s),o),zoom:o}},fitBounds:function(t,i){if(!(t=D(t)).isValid())throw new Error("Bounds are not valid.");var e=this._getBoundsCenterZoom(t,i);return this.setView(e.center,e.zoom,i)},fitWorld:function(t){return this.fitBounds([[-90,-180],[90,180]],t)},panTo:function(t,i){return this.setView(t,this._zoom,{pan:i})},panBy:function(t,i){if(i=i||{},!(t=I(t).round()).x&&!t.y)return this.fire("moveend");if(!0!==i.animate&&!this.getSize().contains(t))return this._resetView(this.unproject(this.project(this.getCenter()).add(t)),this.getZoom()),this;if(this._panAnim||(this._panAnim=new Xi,this._panAnim.on({step:this._onPanTransitionStep,end:this._onPanTransitionEnd},this)),i.noMoveStart||this.fire("movestart"),!1!==i.animate){pi(this._mapPane,"leaflet-pan-anim");var e=this._getMapPanePos().subtract(t).round();this._panAnim.run(this._mapPane,e,i.duration||.25,i.easeLinearity)}else this._rawPanBy(t),this.fire("move").fire("moveend");return this},flyTo:function(n,o,t){if(!1===(t=t||{}).animate||!yt)return this.setView(n,o,t);this._stop();var s=this.project(this.getCenter()),r=this.project(n),i=this.getSize(),a=this._zoom;n=W(n),o=void 0===o?a:o;var h=Math.max(i.x,i.y),u=h*this.getZoomScale(a,o),l=r.distanceTo(s)||1,c=1.42,_=c*c;function e(t){var i=(u*u-h*h+(t?-1:1)*_*_*l*l)/(2*(t?u:h)*_*l),e=Math.sqrt(i*i+1)-i;return e<1e-9?-18:Math.log(e)}function d(t){return(Math.exp(t)-Math.exp(-t))/2}function p(t){return(Math.exp(t)+Math.exp(-t))/2}var m=e(0);function f(t){return h*(p(m)*function(t){return d(t)/p(t)}(m+c*t)-d(m))/_}var g=Date.now(),v=(e(1)-m)/c,y=t.duration?1e3*t.duration:1e3*v*.8;return this._moveStart(!0,t.noMoveStart),function t(){var i=(Date.now()-g)/y,e=function(t){return 1-Math.pow(1-t,1.5)}(i)*v;i<=1?(this._flyToFrame=M(t,this),this._move(this.unproject(s.add(r.subtract(s).multiplyBy(f(e)/l)),a),this.getScaleZoom(h/function(t){return h*(p(m)/p(m+c*t))}(e),a),{flyTo:!0})):this._move(n,o)._moveEnd(!0)}.call(this),this},flyToBounds:function(t,i){var e=this._getBoundsCenterZoom(t,i);return this.flyTo(e.center,e.zoom,i)},setMaxBounds:function(t){return(t=D(t)).isValid()?(this.options.maxBounds&&this.off("moveend",this._panInsideMaxBounds),this.options.maxBounds=t,this._loaded&&this._panInsideMaxBounds(),this.on("moveend",this._panInsideMaxBounds)):(this.options.maxBounds=null,this.off("moveend",this._panInsideMaxBounds))},setMinZoom:function(t){var i=this.options.minZoom;return this.options.minZoom=t,this._loaded&&i!==t&&(this.fire("zoomlevelschange"),this.getZoom()<this.options.minZoom)?this.setZoom(t):this},setMaxZoom:function(t){var i=this.options.maxZoom;return this.options.maxZoom=t,this._loaded&&i!==t&&(this.fire("zoomlevelschange"),this.getZoom()>this.options.maxZoom)?this.setZoom(t):this},panInsideBounds:function(t,i){this._enforcingBounds=!0;var e=this.getCenter(),n=this._limitCenter(e,this._zoom,D(t));return e.equals(n)||this.panTo(n,i),this._enforcingBounds=!1,this},panInside:function(t,i){var e=I((i=i||{}).paddingTopLeft||i.padding||[0,0]),n=I(i.paddingBottomRight||i.padding||[0,0]),o=this.getCenter(),s=this.project(o),r=this.project(t),a=this.getPixelBounds(),h=a.getSize().divideBy(2),u=R([a.min.add(e),a.max.subtract(n)]);if(!u.contains(r)){this._enforcingBounds=!0;var l=s.subtract(r),c=I(r.x+l.x,r.y+l.y);(r.x<u.min.x||r.x>u.max.x)&&(c.x=s.x-l.x,0<l.x?c.x+=h.x-e.x:c.x-=h.x-n.x),(r.y<u.min.y||r.y>u.max.y)&&(c.y=s.y-l.y,0<l.y?c.y+=h.y-e.y:c.y-=h.y-n.y),this.panTo(this.unproject(c),i),this._enforcingBounds=!1}return this},invalidateSize:function(t){if(!this._loaded)return this;t=h({animate:!1,pan:!0},!0===t?{animate:!0}:t);var i=this.getSize();this._sizeChanged=!0,this._lastCenter=null;var e=this.getSize(),n=i.divideBy(2).round(),o=e.divideBy(2).round(),s=n.subtract(o);return s.x||s.y?(t.animate&&t.pan?this.panBy(s):(t.pan&&this._rawPanBy(s),this.fire("move"),t.debounceMoveend?(clearTimeout(this._sizeTimer),this._sizeTimer=setTimeout(a(this.fire,this,"moveend"),200)):this.fire("moveend")),this.fire("resize",{oldSize:i,newSize:e})):this},stop:function(){return this.setZoom(this._limitZoom(this._zoom)),this.options.zoomSnap||this.fire("viewreset"),this._stop()},locate:function(t){if(t=this._locateOptions=h({timeout:1e4,watch:!1},t),!("geolocation"in navigator))return this._handleGeolocationError({code:0,message:"Geolocation not supported."}),this;var i=a(this._handleGeolocationResponse,this),e=a(this._handleGeolocationError,this);return t.watch?this._locationWatchId=navigator.geolocation.watchPosition(i,e,t):navigator.geolocation.getCurrentPosition(i,e,t),this},stopLocate:function(){return navigator.geolocation&&navigator.geolocation.clearWatch&&navigator.geolocation.clearWatch(this._locationWatchId),this._locateOptions&&(this._locateOptions.setView=!1),this},_handleGeolocationError:function(t){var i=t.code,e=t.message||(1===i?"permission denied":2===i?"position unavailable":"timeout");this._locateOptions.setView&&!this._loaded&&this.fitWorld(),this.fire("locationerror",{code:i,message:"Geolocation error: "+e+"."})},_handleGeolocationResponse:function(t){var i=new j(t.coords.latitude,t.coords.longitude),e=i.toBounds(2*t.coords.accuracy),n=this._locateOptions;if(n.setView){var o=this.getBoundsZoom(e);this.setView(i,n.maxZoom?Math.min(o,n.maxZoom):o)}var s={latlng:i,bounds:e,timestamp:t.timestamp};for(var r in t.coords)"number"==typeof t.coords[r]&&(s[r]=t.coords[r]);this.fire("locationfound",s)},addHandler:function(t,i){if(!i)return this;var e=this[t]=new i(this);return this._handlers.push(e),this.options[t]&&e.enable(),this},remove:function(){if(this._initEvents(!0),this._containerId!==this._container._leaflet_id)throw new Error("Map container is being reused by another instance");try{delete this._container._leaflet_id,delete this._containerId}catch(t){this._container._leaflet_id=void 0,this._containerId=void 0}var t;for(t in void 0!==this._locationWatchId&&this.stopLocate(),this._stop(),ui(this._mapPane),this._clearControlPos&&this._clearControlPos(),this._resizeRequest&&(C(this._resizeRequest),this._resizeRequest=null),this._clearHandlers(),this._loaded&&this.fire("unload"),this._layers)this._layers[t].remove();for(t in this._panes)ui(this._panes[t]);return this._layers=[],this._panes=[],delete this._mapPane,delete this._renderer,this},createPane:function(t,i){var e=hi("div","leaflet-pane"+(t?" leaflet-"+t.replace("Pane","")+"-pane":""),i||this._mapPane);return t&&(this._panes[t]=e),e},getCenter:function(){return this._checkIfLoaded(),this._lastCenter&&!this._moved()?this._lastCenter:this.layerPointToLatLng(this._getCenterLayerPoint())},getZoom:function(){return this._zoom},getBounds:function(){var t=this.getPixelBounds();return new N(this.unproject(t.getBottomLeft()),this.unproject(t.getTopRight()))},getMinZoom:function(){return void 0===this.options.minZoom?this._layersMinZoom||0:this.options.minZoom},getMaxZoom:function(){return void 0===this.options.maxZoom?void 0===this._layersMaxZoom?1/0:this._layersMaxZoom:this.options.maxZoom},getBoundsZoom:function(t,i,e){t=D(t),e=I(e||[0,0]);var n=this.getZoom()||0,o=this.getMinZoom(),s=this.getMaxZoom(),r=t.getNorthWest(),a=t.getSouthEast(),h=this.getSize().subtract(e),u=R(this.project(a,n),this.project(r,n)).getSize(),l=yt?this.options.zoomSnap:1,c=h.x/u.x,_=h.y/u.y,d=i?Math.max(c,_):Math.min(c,_);return n=this.getScaleZoom(d,n),l&&(n=Math.round(n/(l/100))*(l/100),n=i?Math.ceil(n/l)*l:Math.floor(n/l)*l),Math.max(o,Math.min(s,n))},getSize:function(){return this._size&&!this._sizeChanged||(this._size=new B(this._container.clientWidth||0,this._container.clientHeight||0),this._sizeChanged=!1),this._size.clone()},getPixelBounds:function(t,i){var e=this._getTopLeftPoint(t,i);return new O(e,e.add(this.getSize()))},getPixelOrigin:function(){return this._checkIfLoaded(),this._pixelOrigin},getPixelWorldBounds:function(t){return this.options.crs.getProjectedBounds(void 0===t?this.getZoom():t)},getPane:function(t){return"string"==typeof t?this._panes[t]:t},getPanes:function(){return this._panes},getContainer:function(){return this._container},getZoomScale:function(t,i){var e=this.options.crs;return i=void 0===i?this._zoom:i,e.scale(t)/e.scale(i)},getScaleZoom:function(t,i){var e=this.options.crs;i=void 0===i?this._zoom:i;var n=e.zoom(t*e.scale(i));return isNaN(n)?1/0:n},project:function(t,i){return i=void 0===i?this._zoom:i,this.options.crs.latLngToPoint(W(t),i)},unproject:function(t,i){return i=void 0===i?this._zoom:i,this.options.crs.pointToLatLng(I(t),i)},layerPointToLatLng:function(t){var i=I(t).add(this.getPixelOrigin());return this.unproject(i)},latLngToLayerPoint:function(t){return this.project(W(t))._round()._subtract(this.getPixelOrigin())},wrapLatLng:function(t){return this.options.crs.wrapLatLng(W(t))},wrapLatLngBounds:function(t){return this.options.crs.wrapLatLngBounds(D(t))},distance:function(t,i){return this.options.crs.distance(W(t),W(i))},containerPointToLayerPoint:function(t){return I(t).subtract(this._getMapPanePos())},layerPointToContainerPoint:function(t){return I(t).add(this._getMapPanePos())},containerPointToLatLng:function(t){var i=this.containerPointToLayerPoint(I(t));return this.layerPointToLatLng(i)},latLngToContainerPoint:function(t){return this.layerPointToContainerPoint(this.latLngToLayerPoint(W(t)))},mouseEventToContainerPoint:function(t){return Wi(t,this._container)},mouseEventToLayerPoint:function(t){return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(t))},mouseEventToLatLng:function(t){return this.layerPointToLatLng(this.mouseEventToLayerPoint(t))},_initContainer:function(t){var i=this._container=ri(t);if(!i)throw new Error("Map container not found.");if(i._leaflet_id)throw new Error("Map container is already initialized.");Ei(i,"scroll",this._onScroll,this),this._containerId=u(i)},_initLayout:function(){var t=this._container;this._fadeAnimated=this.options.fadeAnimation&&yt,pi(t,"leaflet-container"+(Tt?" leaflet-touch":"")+(Ct?" leaflet-retina":"")+(et?" leaflet-oldie":"")+(_t?" leaflet-safari":"")+(this._fadeAnimated?" leaflet-fade-anim":""));var i=ai(t,"position");"absolute"!==i&&"relative"!==i&&"fixed"!==i&&(t.style.position="relative"),this._initPanes(),this._initControlPos&&this._initControlPos()},_initPanes:function(){var t=this._panes={};this._paneRenderers={},this._mapPane=this.createPane("mapPane",this._container),wi(this._mapPane,new B(0,0)),this.createPane("tilePane"),this.createPane("shadowPane"),this.createPane("overlayPane"),this.createPane("markerPane"),this.createPane("tooltipPane"),this.createPane("popupPane"),this.options.markerZoomAnimation||(pi(t.markerPane,"leaflet-zoom-hide"),pi(t.shadowPane,"leaflet-zoom-hide"))},_resetView:function(t,i){wi(this._mapPane,new B(0,0));var e=!this._loaded;this._loaded=!0,i=this._limitZoom(i),this.fire("viewprereset");var n=this._zoom!==i;this._moveStart(n,!1)._move(t,i)._moveEnd(n),this.fire("viewreset"),e&&this.fire("load")},_moveStart:function(t,i){return t&&this.fire("zoomstart"),i||this.fire("movestart"),this},_move:function(t,i,e){void 0===i&&(i=this._zoom);var n=this._zoom!==i;return this._zoom=i,this._lastCenter=t,this._pixelOrigin=this._getNewPixelOrigin(t),(n||e&&e.pinch)&&this.fire("zoom",e),this.fire("move",e)},_moveEnd:function(t){return t&&this.fire("zoomend"),this.fire("moveend")},_stop:function(){return C(this._flyToFrame),this._panAnim&&this._panAnim.stop(),this},_rawPanBy:function(t){wi(this._mapPane,this._getMapPanePos().subtract(t))},_getZoomSpan:function(){return this.getMaxZoom()-this.getMinZoom()},_panInsideMaxBounds:function(){this._enforcingBounds||this.panInsideBounds(this.options.maxBounds)},_checkIfLoaded:function(){if(!this._loaded)throw new Error("Set map center and zoom first.")},_initEvents:function(t){this._targets={};var i=t?Bi:Ei;i((this._targets[u(this._container)]=this)._container,"click dblclick mousedown mouseup mouseover mouseout mousemove contextmenu keypress keydown keyup",this._handleDOMEvent,this),this.options.trackResize&&i(window,"resize",this._onResize,this),yt&&this.options.transform3DLimit&&(t?this.off:this.on).call(this,"moveend",this._onMoveEnd)},_onResize:function(){C(this._resizeRequest),this._resizeRequest=M(function(){this.invalidateSize({debounceMoveend:!0})},this)},_onScroll:function(){this._container.scrollTop=0,this._container.scrollLeft=0},_onMoveEnd:function(){var t=this._getMapPanePos();Math.max(Math.abs(t.x),Math.abs(t.y))>=this.options.transform3DLimit&&this._resetView(this.getCenter(),this.getZoom())},_findEventTargets:function(t,i){for(var e,n=[],o="mouseout"===i||"mouseover"===i,s=t.target||t.srcElement,r=!1;s;){if((e=this._targets[u(s)])&&("click"===i||"preclick"===i)&&!t._simulated&&this._draggableMoved(e)){r=!0;break}if(e&&e.listens(i,!0)){if(o&&!Ki(s,t))break;if(n.push(e),o)break}if(s===this._container)break;s=s.parentNode}return n.length||r||o||!Ki(s,t)||(n=[this]),n},_handleDOMEvent:function(t){if(this._loaded&&!Gi(t)){var i=t.type;"mousedown"!==i&&"keypress"!==i&&"keyup"!==i&&"keydown"!==i||zi(t.target||t.srcElement),this._fireDOMEvent(t,i)}},_mouseEvents:["click","dblclick","mouseover","mouseout","contextmenu"],_fireDOMEvent:function(t,i,e){if("click"===t.type){var n=h({},t);n.type="preclick",this._fireDOMEvent(n,n.type,e)}if(!t._stopped&&(e=(e||[]).concat(this._findEventTargets(t,i))).length){var o=e[0];"contextmenu"===i&&o.listens(i,!0)&&Di(t);var s={originalEvent:t};if("keypress"!==t.type&&"keydown"!==t.type&&"keyup"!==t.type){var r=o.getLatLng&&(!o._radius||o._radius<=10);s.containerPoint=r?this.latLngToContainerPoint(o.getLatLng()):this.mouseEventToContainerPoint(t),s.layerPoint=this.containerPointToLayerPoint(s.containerPoint),s.latlng=r?o.getLatLng():this.layerPointToLatLng(s.layerPoint)}for(var a=0;a<e.length;a++)if(e[a].fire(i,s,!0),s.originalEvent._stopped||!1===e[a].options.bubblingMouseEvents&&-1!==y(this._mouseEvents,i))return}},_draggableMoved:function(t){return(t=t.dragging&&t.dragging.enabled()?t:this).dragging&&t.dragging.moved()||this.boxZoom&&this.boxZoom.moved()},_clearHandlers:function(){for(var t=0,i=this._handlers.length;t<i;t++)this._handlers[t].disable()},whenReady:function(t,i){return this._loaded?t.call(i||this,{target:this}):this.on("load",t,i),this},_getMapPanePos:function(){return Pi(this._mapPane)||new B(0,0)},_moved:function(){var t=this._getMapPanePos();return t&&!t.equals([0,0])},_getTopLeftPoint:function(t,i){return(t&&void 0!==i?this._getNewPixelOrigin(t,i):this.getPixelOrigin()).subtract(this._getMapPanePos())},_getNewPixelOrigin:function(t,i){var e=this.getSize()._divideBy(2);return this.project(t,i)._subtract(e)._add(this._getMapPanePos())._round()},_latLngToNewLayerPoint:function(t,i,e){var n=this._getNewPixelOrigin(e,i);return this.project(t,i)._subtract(n)},_latLngBoundsToNewLayerBounds:function(t,i,e){var n=this._getNewPixelOrigin(e,i);return R([this.project(t.getSouthWest(),i)._subtract(n),this.project(t.getNorthWest(),i)._subtract(n),this.project(t.getSouthEast(),i)._subtract(n),this.project(t.getNorthEast(),i)._subtract(n)])},_getCenterLayerPoint:function(){return this.containerPointToLayerPoint(this.getSize()._divideBy(2))},_getCenterOffset:function(t){return this.latLngToLayerPoint(t).subtract(this._getCenterLayerPoint())},_limitCenter:function(t,i,e){if(!e)return t;var n=this.project(t,i),o=this.getSize().divideBy(2),s=new O(n.subtract(o),n.add(o)),r=this._getBoundsOffset(s,e,i);return r.round().equals([0,0])?t:this.unproject(n.add(r),i)},_limitOffset:function(t,i){if(!i)return t;var e=this.getPixelBounds(),n=new O(e.min.add(t),e.max.add(t));return t.add(this._getBoundsOffset(n,i))},_getBoundsOffset:function(t,i,e){var n=R(this.project(i.getNorthEast(),e),this.project(i.getSouthWest(),e)),o=n.min.subtract(t.min),s=n.max.subtract(t.max);return new B(this._rebound(o.x,-s.x),this._rebound(o.y,-s.y))},_rebound:function(t,i){return 0<t+i?Math.round(t-i)/2:Math.max(0,Math.ceil(t))-Math.max(0,Math.floor(i))},_limitZoom:function(t){var i=this.getMinZoom(),e=this.getMaxZoom(),n=yt?this.options.zoomSnap:1;return n&&(t=Math.round(t/n)*n),Math.max(i,Math.min(e,t))},_onPanTransitionStep:function(){this.fire("move")},_onPanTransitionEnd:function(){mi(this._mapPane,"leaflet-pan-anim"),this.fire("moveend")},_tryAnimatedPan:function(t,i){var e=this._getCenterOffset(t)._trunc();return!(!0!==(i&&i.animate)&&!this.getSize().contains(e))&&(this.panBy(e,i),!0)},_createAnimProxy:function(){var t=this._proxy=hi("div","leaflet-proxy leaflet-zoom-animated");this._panes.mapPane.appendChild(t),this.on("zoomanim",function(t){var i=ni,e=this._proxy.style[i];xi(this._proxy,this.project(t.center,t.zoom),this.getZoomScale(t.zoom,1)),e===this._proxy.style[i]&&this._animatingZoom&&this._onZoomTransitionEnd()},this),this.on("load moveend",function(){var t=this.getCenter(),i=this.getZoom();xi(this._proxy,this.project(t,i),this.getZoomScale(i,1))},this),this._on("unload",this._destroyAnimProxy,this)},_destroyAnimProxy:function(){ui(this._proxy),delete this._proxy},_catchTransitionEnd:function(t){this._animatingZoom&&0<=t.propertyName.indexOf("transform")&&this._onZoomTransitionEnd()},_nothingToAnimate:function(){return!this._container.getElementsByClassName("leaflet-zoom-animated").length},_tryAnimatedZoom:function(t,i,e){if(this._animatingZoom)return!0;if(e=e||{},!this._zoomAnimated||!1===e.animate||this._nothingToAnimate()||Math.abs(i-this._zoom)>this.options.zoomAnimationThreshold)return!1;var n=this.getZoomScale(i),o=this._getCenterOffset(t)._divideBy(1-1/n);return!(!0!==e.animate&&!this.getSize().contains(o))&&(M(function(){this._moveStart(!0,!1)._animateZoom(t,i,!0)},this),!0)},_animateZoom:function(t,i,e,n){this._mapPane&&(e&&(this._animatingZoom=!0,this._animateToCenter=t,this._animateToZoom=i,pi(this._mapPane,"leaflet-zoom-anim")),this.fire("zoomanim",{center:t,zoom:i,noUpdate:n}),setTimeout(a(this._onZoomTransitionEnd,this),250))},_onZoomTransitionEnd:function(){this._animatingZoom&&(this._mapPane&&mi(this._mapPane,"leaflet-zoom-anim"),this._animatingZoom=!1,this._move(this._animateToCenter,this._animateToZoom),M(function(){this._moveEnd(!0)},this))}});function $i(t){return new Qi(t)}var Qi=Z.extend({options:{position:"topright"},initialize:function(t){p(this,t)},getPosition:function(){return this.options.position},setPosition:function(t){var i=this._map;return i&&i.removeControl(this),this.options.position=t,i&&i.addControl(this),this},getContainer:function(){return this._container},addTo:function(t){this.remove(),this._map=t;var i=this._container=this.onAdd(t),e=this.getPosition(),n=t._controlCorners[e];return pi(i,"leaflet-control"),-1!==e.indexOf("bottom")?n.insertBefore(i,n.firstChild):n.appendChild(i),this._map.on("unload",this.remove,this),this},remove:function(){return this._map&&(ui(this._container),this.onRemove&&this.onRemove(this._map),this._map.off("unload",this.remove,this),this._map=null),this},_refocusOnMap:function(t){this._map&&t&&0<t.screenX&&0<t.screenY&&this._map.getContainer().focus()}});Ji.include({addControl:function(t){return t.addTo(this),this},removeControl:function(t){return t.remove(),this},_initControlPos:function(){var n=this._controlCorners={},o="leaflet-",s=this._controlContainer=hi("div",o+"control-container",this._container);function t(t,i){var e=o+t+" "+o+i;n[t+i]=hi("div",e,s)}t("top","left"),t("top","right"),t("bottom","left"),t("bottom","right")},_clearControlPos:function(){for(var t in this._controlCorners)ui(this._controlCorners[t]);ui(this._controlContainer),delete this._controlCorners,delete this._controlContainer}});var te=Qi.extend({options:{collapsed:!0,position:"topright",autoZIndex:!0,hideSingleBase:!1,sortLayers:!1,sortFunction:function(t,i,e,n){return e<n?-1:n<e?1:0}},initialize:function(t,i,e){for(var n in p(this,e),this._layerControlInputs=[],this._layers=[],this._lastZIndex=0,this._handlingClick=!1,t)this._addLayer(t[n],n);for(n in i)this._addLayer(i[n],n,!0)},onAdd:function(t){this._initLayout(),this._update(),(this._map=t).on("zoomend",this._checkDisabledLayers,this);for(var i=0;i<this._layers.length;i++)this._layers[i].layer.on("add remove",this._onLayerChange,this);return this._container},addTo:function(t){return Qi.prototype.addTo.call(this,t),this._expandIfNotCollapsed()},onRemove:function(){this._map.off("zoomend",this._checkDisabledLayers,this);for(var t=0;t<this._layers.length;t++)this._layers[t].layer.off("add remove",this._onLayerChange,this)},addBaseLayer:function(t,i){return this._addLayer(t,i),this._map?this._update():this},addOverlay:function(t,i){return this._addLayer(t,i,!0),this._map?this._update():this},removeLayer:function(t){t.off("add remove",this._onLayerChange,this);var i=this._getLayer(u(t));return i&&this._layers.splice(this._layers.indexOf(i),1),this._map?this._update():this},expand:function(){pi(this._container,"leaflet-control-layers-expanded"),this._section.style.height=null;var t=this._map.getSize().y-(this._container.offsetTop+50);return t<this._section.clientHeight?(pi(this._section,"leaflet-control-layers-scrollbar"),this._section.style.height=t+"px"):mi(this._section,"leaflet-control-layers-scrollbar"),this._checkDisabledLayers(),this},collapse:function(){return mi(this._container,"leaflet-control-layers-expanded"),this},_initLayout:function(){var t="leaflet-control-layers",i=this._container=hi("div",t),e=this.options.collapsed;i.setAttribute("aria-haspopup",!0),Ni(i),Ri(i);var n=this._section=hi("section",t+"-list");e&&(this._map.on("click",this.collapse,this),st||Ei(i,{mouseenter:this.expand,mouseleave:this.collapse},this));var o=this._layersLink=hi("a",t+"-toggle",i);o.href="#",o.title="Layers",Tt?(Ei(o,"click",ji),Ei(o,"click",this.expand,this)):Ei(o,"focus",this.expand,this),e||this.expand(),this._baseLayersList=hi("div",t+"-base",n),this._separator=hi("div",t+"-separator",n),this._overlaysList=hi("div",t+"-overlays",n),i.appendChild(n)},_getLayer:function(t){for(var i=0;i<this._layers.length;i++)if(this._layers[i]&&u(this._layers[i].layer)===t)return this._layers[i]},_addLayer:function(t,i,e){this._map&&t.on("add remove",this._onLayerChange,this),this._layers.push({layer:t,name:i,overlay:e}),this.options.sortLayers&&this._layers.sort(a(function(t,i){return this.options.sortFunction(t.layer,i.layer,t.name,i.name)},this)),this.options.autoZIndex&&t.setZIndex&&(this._lastZIndex++,t.setZIndex(this._lastZIndex)),this._expandIfNotCollapsed()},_update:function(){if(!this._container)return this;li(this._baseLayersList),li(this._overlaysList),this._layerControlInputs=[];var t,i,e,n,o=0;for(e=0;e<this._layers.length;e++)n=this._layers[e],this._addItem(n),i=i||n.overlay,t=t||!n.overlay,o+=n.overlay?0:1;return this.options.hideSingleBase&&(t=t&&1<o,this._baseLayersList.style.display=t?"":"none"),this._separator.style.display=i&&t?"":"none",this},_onLayerChange:function(t){this._handlingClick||this._update();var i=this._getLayer(u(t.target)),e=i.overlay?"add"===t.type?"overlayadd":"overlayremove":"add"===t.type?"baselayerchange":null;e&&this._map.fire(e,i)},_createRadioElement:function(t,i){var e='<input type="radio" class="leaflet-control-layers-selector" name="'+t+'"'+(i?' checked="checked"':"")+"/>",n=document.createElement("div");return n.innerHTML=e,n.firstChild},_addItem:function(t){var i,e=document.createElement("label"),n=this._map.hasLayer(t.layer);t.overlay?((i=document.createElement("input")).type="checkbox",i.className="leaflet-control-layers-selector",i.defaultChecked=n):i=this._createRadioElement("leaflet-base-layers_"+u(this),n),this._layerControlInputs.push(i),i.layerId=u(t.layer),Ei(i,"click",this._onInputClick,this);var o=document.createElement("span");o.innerHTML=" "+t.name;var s=document.createElement("div");return e.appendChild(s),s.appendChild(i),s.appendChild(o),(t.overlay?this._overlaysList:this._baseLayersList).appendChild(e),this._checkDisabledLayers(),e},_onInputClick:function(){var t,i,e=this._layerControlInputs,n=[],o=[];this._handlingClick=!0;for(var s=e.length-1;0<=s;s--)t=e[s],i=this._getLayer(t.layerId).layer,t.checked?n.push(i):t.checked||o.push(i);for(s=0;s<o.length;s++)this._map.hasLayer(o[s])&&this._map.removeLayer(o[s]);for(s=0;s<n.length;s++)this._map.hasLayer(n[s])||this._map.addLayer(n[s]);this._handlingClick=!1,this._refocusOnMap()},_checkDisabledLayers:function(){for(var t,i,e=this._layerControlInputs,n=this._map.getZoom(),o=e.length-1;0<=o;o--)t=e[o],i=this._getLayer(t.layerId).layer,t.disabled=void 0!==i.options.minZoom&&n<i.options.minZoom||void 0!==i.options.maxZoom&&n>i.options.maxZoom},_expandIfNotCollapsed:function(){return this._map&&!this.options.collapsed&&this.expand(),this},_expand:function(){return this.expand()},_collapse:function(){return this.collapse()}}),ie=Qi.extend({options:{position:"topleft",zoomInText:"+",zoomInTitle:"Zoom in",zoomOutText:"&#x2212;",zoomOutTitle:"Zoom out"},onAdd:function(t){var i="leaflet-control-zoom",e=hi("div",i+" leaflet-bar"),n=this.options;return this._zoomInButton=this._createButton(n.zoomInText,n.zoomInTitle,i+"-in",e,this._zoomIn),this._zoomOutButton=this._createButton(n.zoomOutText,n.zoomOutTitle,i+"-out",e,this._zoomOut),this._updateDisabled(),t.on("zoomend zoomlevelschange",this._updateDisabled,this),e},onRemove:function(t){t.off("zoomend zoomlevelschange",this._updateDisabled,this)},disable:function(){return this._disabled=!0,this._updateDisabled(),this},enable:function(){return this._disabled=!1,this._updateDisabled(),this},_zoomIn:function(t){!this._disabled&&this._map._zoom<this._map.getMaxZoom()&&this._map.zoomIn(this._map.options.zoomDelta*(t.shiftKey?3:1))},_zoomOut:function(t){!this._disabled&&this._map._zoom>this._map.getMinZoom()&&this._map.zoomOut(this._map.options.zoomDelta*(t.shiftKey?3:1))},_createButton:function(t,i,e,n,o){var s=hi("a",e,n);return s.innerHTML=t,s.href="#",s.title=i,s.setAttribute("role","button"),s.setAttribute("aria-label",i),Ni(s),Ei(s,"click",ji),Ei(s,"click",o,this),Ei(s,"click",this._refocusOnMap,this),s},_updateDisabled:function(){var t=this._map,i="leaflet-disabled";mi(this._zoomInButton,i),mi(this._zoomOutButton,i),!this._disabled&&t._zoom!==t.getMinZoom()||pi(this._zoomOutButton,i),!this._disabled&&t._zoom!==t.getMaxZoom()||pi(this._zoomInButton,i)}});Ji.mergeOptions({zoomControl:!0}),Ji.addInitHook(function(){this.options.zoomControl&&(this.zoomControl=new ie,this.addControl(this.zoomControl))});var ee=Qi.extend({options:{position:"bottomleft",maxWidth:100,metric:!0,imperial:!0},onAdd:function(t){var i="leaflet-control-scale",e=hi("div",i),n=this.options;return this._addScales(n,i+"-line",e),t.on(n.updateWhenIdle?"moveend":"move",this._update,this),t.whenReady(this._update,this),e},onRemove:function(t){t.off(this.options.updateWhenIdle?"moveend":"move",this._update,this)},_addScales:function(t,i,e){t.metric&&(this._mScale=hi("div",i,e)),t.imperial&&(this._iScale=hi("div",i,e))},_update:function(){var t=this._map,i=t.getSize().y/2,e=t.distance(t.containerPointToLatLng([0,i]),t.containerPointToLatLng([this.options.maxWidth,i]));this._updateScales(e)},_updateScales:function(t){this.options.metric&&t&&this._updateMetric(t),this.options.imperial&&t&&this._updateImperial(t)},_updateMetric:function(t){var i=this._getRoundNum(t),e=i<1e3?i+" m":i/1e3+" km";this._updateScale(this._mScale,e,i/t)},_updateImperial:function(t){var i,e,n,o=3.2808399*t;5280<o?(i=o/5280,e=this._getRoundNum(i),this._updateScale(this._iScale,e+" mi",e/i)):(n=this._getRoundNum(o),this._updateScale(this._iScale,n+" ft",n/o))},_updateScale:function(t,i,e){t.style.width=Math.round(this.options.maxWidth*e)+"px",t.innerHTML=i},_getRoundNum:function(t){var i=Math.pow(10,(Math.floor(t)+"").length-1),e=t/i;return i*(e=10<=e?10:5<=e?5:3<=e?3:2<=e?2:1)}}),ne=Qi.extend({options:{position:"bottomright",prefix:'<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'},initialize:function(t){p(this,t),this._attributions={}},onAdd:function(t){for(var i in(t.attributionControl=this)._container=hi("div","leaflet-control-attribution"),Ni(this._container),t._layers)t._layers[i].getAttribution&&this.addAttribution(t._layers[i].getAttribution());return this._update(),this._container},setPrefix:function(t){return this.options.prefix=t,this._update(),this},addAttribution:function(t){return t&&(this._attributions[t]||(this._attributions[t]=0),this._attributions[t]++,this._update()),this},removeAttribution:function(t){return t&&this._attributions[t]&&(this._attributions[t]--,this._update()),this},_update:function(){if(this._map){var t=[];for(var i in this._attributions)this._attributions[i]&&t.push(i);var e=[];this.options.prefix&&e.push(this.options.prefix),t.length&&e.push(t.join(", ")),this._container.innerHTML=e.join(" | ")}}});Ji.mergeOptions({attributionControl:!0}),Ji.addInitHook(function(){this.options.attributionControl&&(new ne).addTo(this)});Qi.Layers=te,Qi.Zoom=ie,Qi.Scale=ee,Qi.Attribution=ne,$i.layers=function(t,i,e){return new te(t,i,e)},$i.zoom=function(t){return new ie(t)},$i.scale=function(t){return new ee(t)},$i.attribution=function(t){return new ne(t)};var oe=Z.extend({initialize:function(t){this._map=t},enable:function(){return this._enabled||(this._enabled=!0,this.addHooks()),this},disable:function(){return this._enabled&&(this._enabled=!1,this.removeHooks()),this},enabled:function(){return!!this._enabled}});oe.addTo=function(t,i){return t.addHandler(i,this),this};var se,re={Events:E},ae=Tt?"touchstart mousedown":"mousedown",he={mousedown:"mouseup",touchstart:"touchend",pointerdown:"touchend",MSPointerDown:"touchend"},ue={mousedown:"mousemove",touchstart:"touchmove",pointerdown:"touchmove",MSPointerDown:"touchmove"},le=k.extend({options:{clickTolerance:3},initialize:function(t,i,e,n){p(this,n),this._element=t,this._dragStartTarget=i||t,this._preventOutline=e},enable:function(){this._enabled||(Ei(this._dragStartTarget,ae,this._onDown,this),this._enabled=!0)},disable:function(){this._enabled&&(le._dragging===this&&this.finishDrag(),Bi(this._dragStartTarget,ae,this._onDown,this),this._enabled=!1,this._moved=!1)},_onDown:function(t){if(!t._simulated&&this._enabled&&(this._moved=!1,!di(this._element,"leaflet-zoom-anim")&&!(le._dragging||t.shiftKey||1!==t.which&&1!==t.button&&!t.touches||((le._dragging=this)._preventOutline&&zi(this._element),bi(),$t(),this._moving)))){this.fire("down");var i=t.touches?t.touches[0]:t,e=Ci(this._element);this._startPoint=new B(i.clientX,i.clientY),this._parentScale=Si(e),Ei(document,ue[t.type],this._onMove,this),Ei(document,he[t.type],this._onUp,this)}},_onMove:function(t){if(!t._simulated&&this._enabled)if(t.touches&&1<t.touches.length)this._moved=!0;else{var i=t.touches&&1===t.touches.length?t.touches[0]:t,e=new B(i.clientX,i.clientY)._subtract(this._startPoint);(e.x||e.y)&&(Math.abs(e.x)+Math.abs(e.y)<this.options.clickTolerance||(e.x/=this._parentScale.x,e.y/=this._parentScale.y,Di(t),this._moved||(this.fire("dragstart"),this._moved=!0,this._startPos=Pi(this._element).subtract(e),pi(document.body,"leaflet-dragging"),this._lastTarget=t.target||t.srcElement,window.SVGElementInstance&&this._lastTarget instanceof SVGElementInstance&&(this._lastTarget=this._lastTarget.correspondingUseElement),pi(this._lastTarget,"leaflet-drag-target")),this._newPos=this._startPos.add(e),this._moving=!0,C(this._animRequest),this._lastEvent=t,this._animRequest=M(this._updatePosition,this,!0)))}},_updatePosition:function(){var t={originalEvent:this._lastEvent};this.fire("predrag",t),wi(this._element,this._newPos),this.fire("drag",t)},_onUp:function(t){!t._simulated&&this._enabled&&this.finishDrag()},finishDrag:function(){for(var t in mi(document.body,"leaflet-dragging"),this._lastTarget&&(mi(this._lastTarget,"leaflet-drag-target"),this._lastTarget=null),ue)Bi(document,ue[t],this._onMove,this),Bi(document,he[t],this._onUp,this);Ti(),Qt(),this._moved&&this._moving&&(C(this._animRequest),this.fire("dragend",{distance:this._newPos.distanceTo(this._startPos)})),this._moving=!1,le._dragging=!1}});function ce(t,i){if(!i||!t.length)return t.slice();var e=i*i;return t=function(t,i){var e=t.length,n=new(typeof Uint8Array!=void 0+""?Uint8Array:Array)(e);n[0]=n[e-1]=1,function t(i,e,n,o,s){var r,a,h,u=0;for(a=o+1;a<=s-1;a++)h=fe(i[a],i[o],i[s],!0),u<h&&(r=a,u=h);n<u&&(e[r]=1,t(i,e,n,o,r),t(i,e,n,r,s))}(t,n,i,0,e-1);var o,s=[];for(o=0;o<e;o++)n[o]&&s.push(t[o]);return s}(t=function(t,i){for(var e=[t[0]],n=1,o=0,s=t.length;n<s;n++)r=t[n],a=t[o],void 0,h=a.x-r.x,u=a.y-r.y,i<h*h+u*u&&(e.push(t[n]),o=n);var r,a,h,u;o<s-1&&e.push(t[s-1]);return e}(t,e),e)}function _e(t,i,e){return Math.sqrt(fe(t,i,e,!0))}function de(t,i,e,n,o){var s,r,a,h=n?se:me(t,e),u=me(i,e);for(se=u;;){if(!(h|u))return[t,i];if(h&u)return!1;a=me(r=pe(t,i,s=h||u,e,o),e),s===h?(t=r,h=a):(i=r,u=a)}}function pe(t,i,e,n,o){var s,r,a=i.x-t.x,h=i.y-t.y,u=n.min,l=n.max;return 8&e?(s=t.x+a*(l.y-t.y)/h,r=l.y):4&e?(s=t.x+a*(u.y-t.y)/h,r=u.y):2&e?(s=l.x,r=t.y+h*(l.x-t.x)/a):1&e&&(s=u.x,r=t.y+h*(u.x-t.x)/a),new B(s,r,o)}function me(t,i){var e=0;return t.x<i.min.x?e|=1:t.x>i.max.x&&(e|=2),t.y<i.min.y?e|=4:t.y>i.max.y&&(e|=8),e}function fe(t,i,e,n){var o,s=i.x,r=i.y,a=e.x-s,h=e.y-r,u=a*a+h*h;return 0<u&&(1<(o=((t.x-s)*a+(t.y-r)*h)/u)?(s=e.x,r=e.y):0<o&&(s+=a*o,r+=h*o)),a=t.x-s,h=t.y-r,n?a*a+h*h:new B(s,r)}function ge(t){return!v(t[0])||"object"!=typeof t[0][0]&&void 0!==t[0][0]}function ve(t){return console.warn("Deprecated use of _flat, please use L.LineUtil.isFlat instead."),ge(t)}var ye=(Object.freeze||Object)({simplify:ce,pointToSegmentDistance:_e,closestPointOnSegment:function(t,i,e){return fe(t,i,e)},clipSegment:de,_getEdgeIntersection:pe,_getBitCode:me,_sqClosestPointOnSegment:fe,isFlat:ge,_flat:ve});function xe(t,i,e){var n,o,s,r,a,h,u,l,c,_=[1,4,2,8];for(o=0,u=t.length;o<u;o++)t[o]._code=me(t[o],i);for(r=0;r<4;r++){for(l=_[r],n=[],o=0,s=(u=t.length)-1;o<u;s=o++)a=t[o],h=t[s],a._code&l?h._code&l||((c=pe(h,a,l,i,e))._code=me(c,i),n.push(c)):(h._code&l&&((c=pe(h,a,l,i,e))._code=me(c,i),n.push(c)),n.push(a));t=n}return t}var we,Pe=(Object.freeze||Object)({clipPolygon:xe}),Le={project:function(t){return new B(t.lng,t.lat)},unproject:function(t){return new j(t.y,t.x)},bounds:new O([-180,-90],[180,90])},be={R:6378137,R_MINOR:6356752.314245179,bounds:new O([-20037508.34279,-15496570.73972],[20037508.34279,18764656.23138]),project:function(t){var i=Math.PI/180,e=this.R,n=t.lat*i,o=this.R_MINOR/e,s=Math.sqrt(1-o*o),r=s*Math.sin(n),a=Math.tan(Math.PI/4-n/2)/Math.pow((1-r)/(1+r),s/2);return n=-e*Math.log(Math.max(a,1e-10)),new B(t.lng*i*e,n)},unproject:function(t){for(var i,e=180/Math.PI,n=this.R,o=this.R_MINOR/n,s=Math.sqrt(1-o*o),r=Math.exp(-t.y/n),a=Math.PI/2-2*Math.atan(r),h=0,u=.1;h<15&&1e-7<Math.abs(u);h++)i=s*Math.sin(a),i=Math.pow((1-i)/(1+i),s/2),a+=u=Math.PI/2-2*Math.atan(r*i)-a;return new j(a*e,t.x*e/n)}},Te=(Object.freeze||Object)({LonLat:Le,Mercator:be,SphericalMercator:q}),ze=h({},U,{code:"EPSG:3395",projection:be,transformation:(we=.5/(Math.PI*be.R),K(we,.5,-we,.5))}),Me=h({},U,{code:"EPSG:4326",projection:Le,transformation:K(1/180,1,-1/180,.5)}),Ce=h({},F,{projection:Le,transformation:K(1,0,-1,0),scale:function(t){return Math.pow(2,t)},zoom:function(t){return Math.log(t)/Math.LN2},distance:function(t,i){var e=i.lng-t.lng,n=i.lat-t.lat;return Math.sqrt(e*e+n*n)},infinite:!0});F.Earth=U,F.EPSG3395=ze,F.EPSG3857=X,F.EPSG900913=J,F.EPSG4326=Me,F.Simple=Ce;var Se=k.extend({options:{pane:"overlayPane",attribution:null,bubblingMouseEvents:!0},addTo:function(t){return t.addLayer(this),this},remove:function(){return this.removeFrom(this._map||this._mapToAdd)},removeFrom:function(t){return t&&t.removeLayer(this),this},getPane:function(t){return this._map.getPane(t?this.options[t]||t:this.options.pane)},addInteractiveTarget:function(t){return this._map._targets[u(t)]=this},removeInteractiveTarget:function(t){return delete this._map._targets[u(t)],this},getAttribution:function(){return this.options.attribution},_layerAdd:function(t){var i=t.target;if(i.hasLayer(this)){if(this._map=i,this._zoomAnimated=i._zoomAnimated,this.getEvents){var e=this.getEvents();i.on(e,this),this.once("remove",function(){i.off(e,this)},this)}this.onAdd(i),this.getAttribution&&i.attributionControl&&i.attributionControl.addAttribution(this.getAttribution()),this.fire("add"),i.fire("layeradd",{layer:this})}}});Ji.include({addLayer:function(t){if(!t._layerAdd)throw new Error("The provided object is not a Layer.");var i=u(t);return this._layers[i]||((this._layers[i]=t)._mapToAdd=this,t.beforeAdd&&t.beforeAdd(this),this.whenReady(t._layerAdd,t)),this},removeLayer:function(t){var i=u(t);return this._layers[i]&&(this._loaded&&t.onRemove(this),t.getAttribution&&this.attributionControl&&this.attributionControl.removeAttribution(t.getAttribution()),delete this._layers[i],this._loaded&&(this.fire("layerremove",{layer:t}),t.fire("remove")),t._map=t._mapToAdd=null),this},hasLayer:function(t){return!!t&&u(t)in this._layers},eachLayer:function(t,i){for(var e in this._layers)t.call(i,this._layers[e]);return this},_addLayers:function(t){for(var i=0,e=(t=t?v(t)?t:[t]:[]).length;i<e;i++)this.addLayer(t[i])},_addZoomLimit:function(t){!isNaN(t.options.maxZoom)&&isNaN(t.options.minZoom)||(this._zoomBoundLayers[u(t)]=t,this._updateZoomLevels())},_removeZoomLimit:function(t){var i=u(t);this._zoomBoundLayers[i]&&(delete this._zoomBoundLayers[i],this._updateZoomLevels())},_updateZoomLevels:function(){var t=1/0,i=-1/0,e=this._getZoomSpan();for(var n in this._zoomBoundLayers){var o=this._zoomBoundLayers[n].options;t=void 0===o.minZoom?t:Math.min(t,o.minZoom),i=void 0===o.maxZoom?i:Math.max(i,o.maxZoom)}this._layersMaxZoom=i===-1/0?void 0:i,this._layersMinZoom=t===1/0?void 0:t,e!==this._getZoomSpan()&&this.fire("zoomlevelschange"),void 0===this.options.maxZoom&&this._layersMaxZoom&&this.getZoom()>this._layersMaxZoom&&this.setZoom(this._layersMaxZoom),void 0===this.options.minZoom&&this._layersMinZoom&&this.getZoom()<this._layersMinZoom&&this.setZoom(this._layersMinZoom)}});var Ze=Se.extend({initialize:function(t,i){var e,n;if(p(this,i),this._layers={},t)for(e=0,n=t.length;e<n;e++)this.addLayer(t[e])},addLayer:function(t){var i=this.getLayerId(t);return this._layers[i]=t,this._map&&this._map.addLayer(t),this},removeLayer:function(t){var i=t in this._layers?t:this.getLayerId(t);return this._map&&this._layers[i]&&this._map.removeLayer(this._layers[i]),delete this._layers[i],this},hasLayer:function(t){return!!t&&(t in this._layers||this.getLayerId(t)in this._layers)},clearLayers:function(){return this.eachLayer(this.removeLayer,this)},invoke:function(t){var i,e,n=Array.prototype.slice.call(arguments,1);for(i in this._layers)(e=this._layers[i])[t]&&e[t].apply(e,n);return this},onAdd:function(t){this.eachLayer(t.addLayer,t)},onRemove:function(t){this.eachLayer(t.removeLayer,t)},eachLayer:function(t,i){for(var e in this._layers)t.call(i,this._layers[e]);return this},getLayer:function(t){return this._layers[t]},getLayers:function(){var t=[];return this.eachLayer(t.push,t),t},setZIndex:function(t){return this.invoke("setZIndex",t)},getLayerId:function(t){return u(t)}}),Ee=Ze.extend({addLayer:function(t){return this.hasLayer(t)?this:(t.addEventParent(this),Ze.prototype.addLayer.call(this,t),this.fire("layeradd",{layer:t}))},removeLayer:function(t){return this.hasLayer(t)?(t in this._layers&&(t=this._layers[t]),t.removeEventParent(this),Ze.prototype.removeLayer.call(this,t),this.fire("layerremove",{layer:t})):this},setStyle:function(t){return this.invoke("setStyle",t)},bringToFront:function(){return this.invoke("bringToFront")},bringToBack:function(){return this.invoke("bringToBack")},getBounds:function(){var t=new N;for(var i in this._layers){var e=this._layers[i];t.extend(e.getBounds?e.getBounds():e.getLatLng())}return t}}),ke=Z.extend({options:{popupAnchor:[0,0],tooltipAnchor:[0,0]},initialize:function(t){p(this,t)},createIcon:function(t){return this._createIcon("icon",t)},createShadow:function(t){return this._createIcon("shadow",t)},_createIcon:function(t,i){var e=this._getIconUrl(t);if(!e){if("icon"===t)throw new Error("iconUrl not set in Icon options (see the docs).");return null}var n=this._createImg(e,i&&"IMG"===i.tagName?i:null);return this._setIconStyles(n,t),n},_setIconStyles:function(t,i){var e=this.options,n=e[i+"Size"];"number"==typeof n&&(n=[n,n]);var o=I(n),s=I("shadow"===i&&e.shadowAnchor||e.iconAnchor||o&&o.divideBy(2,!0));t.className="leaflet-marker-"+i+" "+(e.className||""),s&&(t.style.marginLeft=-s.x+"px",t.style.marginTop=-s.y+"px"),o&&(t.style.width=o.x+"px",t.style.height=o.y+"px")},_createImg:function(t,i){return(i=i||document.createElement("img")).src=t,i},_getIconUrl:function(t){return Ct&&this.options[t+"RetinaUrl"]||this.options[t+"Url"]}});var Be=ke.extend({options:{iconUrl:"marker-icon.png",iconRetinaUrl:"marker-icon-2x.png",shadowUrl:"marker-shadow.png",iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],tooltipAnchor:[16,-28],shadowSize:[41,41]},_getIconUrl:function(t){return Be.imagePath||(Be.imagePath=this._detectIconPath()),(this.options.imagePath||Be.imagePath)+ke.prototype._getIconUrl.call(this,t)},_detectIconPath:function(){var t=hi("div","leaflet-default-icon-path",document.body),i=ai(t,"background-image")||ai(t,"backgroundImage");return document.body.removeChild(t),i=null===i||0!==i.indexOf("url")?"":i.replace(/^url\(["']?/,"").replace(/marker-icon\.png["']?\)$/,"")}}),Ae=oe.extend({initialize:function(t){this._marker=t},addHooks:function(){var t=this._marker._icon;this._draggable||(this._draggable=new le(t,t,!0)),this._draggable.on({dragstart:this._onDragStart,predrag:this._onPreDrag,drag:this._onDrag,dragend:this._onDragEnd},this).enable(),pi(t,"leaflet-marker-draggable")},removeHooks:function(){this._draggable.off({dragstart:this._onDragStart,predrag:this._onPreDrag,drag:this._onDrag,dragend:this._onDragEnd},this).disable(),this._marker._icon&&mi(this._marker._icon,"leaflet-marker-draggable")},moved:function(){return this._draggable&&this._draggable._moved},_adjustPan:function(t){var i=this._marker,e=i._map,n=this._marker.options.autoPanSpeed,o=this._marker.options.autoPanPadding,s=Pi(i._icon),r=e.getPixelBounds(),a=e.getPixelOrigin(),h=R(r.min._subtract(a).add(o),r.max._subtract(a).subtract(o));if(!h.contains(s)){var u=I((Math.max(h.max.x,s.x)-h.max.x)/(r.max.x-h.max.x)-(Math.min(h.min.x,s.x)-h.min.x)/(r.min.x-h.min.x),(Math.max(h.max.y,s.y)-h.max.y)/(r.max.y-h.max.y)-(Math.min(h.min.y,s.y)-h.min.y)/(r.min.y-h.min.y)).multiplyBy(n);e.panBy(u,{animate:!1}),this._draggable._newPos._add(u),this._draggable._startPos._add(u),wi(i._icon,this._draggable._newPos),this._onDrag(t),this._panRequest=M(this._adjustPan.bind(this,t))}},_onDragStart:function(){this._oldLatLng=this._marker.getLatLng(),this._marker.closePopup().fire("movestart").fire("dragstart")},_onPreDrag:function(t){this._marker.options.autoPan&&(C(this._panRequest),this._panRequest=M(this._adjustPan.bind(this,t)))},_onDrag:function(t){var i=this._marker,e=i._shadow,n=Pi(i._icon),o=i._map.layerPointToLatLng(n);e&&wi(e,n),i._latlng=o,t.latlng=o,t.oldLatLng=this._oldLatLng,i.fire("move",t).fire("drag",t)},_onDragEnd:function(t){C(this._panRequest),delete this._oldLatLng,this._marker.fire("moveend").fire("dragend",t)}}),Ie=Se.extend({options:{icon:new Be,interactive:!0,keyboard:!0,title:"",alt:"",zIndexOffset:0,opacity:1,riseOnHover:!1,riseOffset:250,pane:"markerPane",shadowPane:"shadowPane",bubblingMouseEvents:!1,draggable:!1,autoPan:!1,autoPanPadding:[50,50],autoPanSpeed:10},initialize:function(t,i){p(this,i),this._latlng=W(t)},onAdd:function(t){this._zoomAnimated=this._zoomAnimated&&t.options.markerZoomAnimation,this._zoomAnimated&&t.on("zoomanim",this._animateZoom,this),this._initIcon(),this.update()},onRemove:function(t){this.dragging&&this.dragging.enabled()&&(this.options.draggable=!0,this.dragging.removeHooks()),delete this.dragging,this._zoomAnimated&&t.off("zoomanim",this._animateZoom,this),this._removeIcon(),this._removeShadow()},getEvents:function(){return{zoom:this.update,viewreset:this.update}},getLatLng:function(){return this._latlng},setLatLng:function(t){var i=this._latlng;return this._latlng=W(t),this.update(),this.fire("move",{oldLatLng:i,latlng:this._latlng})},setZIndexOffset:function(t){return this.options.zIndexOffset=t,this.update()},getIcon:function(){return this.options.icon},setIcon:function(t){return this.options.icon=t,this._map&&(this._initIcon(),this.update()),this._popup&&this.bindPopup(this._popup,this._popup.options),this},getElement:function(){return this._icon},update:function(){if(this._icon&&this._map){var t=this._map.latLngToLayerPoint(this._latlng).round();this._setPos(t)}return this},_initIcon:function(){var t=this.options,i="leaflet-zoom-"+(this._zoomAnimated?"animated":"hide"),e=t.icon.createIcon(this._icon),n=!1;e!==this._icon&&(this._icon&&this._removeIcon(),n=!0,t.title&&(e.title=t.title),"IMG"===e.tagName&&(e.alt=t.alt||"")),pi(e,i),t.keyboard&&(e.tabIndex="0"),this._icon=e,t.riseOnHover&&this.on({mouseover:this._bringToFront,mouseout:this._resetZIndex});var o=t.icon.createShadow(this._shadow),s=!1;o!==this._shadow&&(this._removeShadow(),s=!0),o&&(pi(o,i),o.alt=""),this._shadow=o,t.opacity<1&&this._updateOpacity(),n&&this.getPane().appendChild(this._icon),this._initInteraction(),o&&s&&this.getPane(t.shadowPane).appendChild(this._shadow)},_removeIcon:function(){this.options.riseOnHover&&this.off({mouseover:this._bringToFront,mouseout:this._resetZIndex}),ui(this._icon),this.removeInteractiveTarget(this._icon),this._icon=null},_removeShadow:function(){this._shadow&&ui(this._shadow),this._shadow=null},_setPos:function(t){wi(this._icon,t),this._shadow&&wi(this._shadow,t),this._zIndex=t.y+this.options.zIndexOffset,this._resetZIndex()},_updateZIndex:function(t){this._icon.style.zIndex=this._zIndex+t},_animateZoom:function(t){var i=this._map._latLngToNewLayerPoint(this._latlng,t.zoom,t.center).round();this._setPos(i)},_initInteraction:function(){if(this.options.interactive&&(pi(this._icon,"leaflet-interactive"),this.addInteractiveTarget(this._icon),Ae)){var t=this.options.draggable;this.dragging&&(t=this.dragging.enabled(),this.dragging.disable()),this.dragging=new Ae(this),t&&this.dragging.enable()}},setOpacity:function(t){return this.options.opacity=t,this._map&&this._updateOpacity(),this},_updateOpacity:function(){var t=this.options.opacity;this._icon&&vi(this._icon,t),this._shadow&&vi(this._shadow,t)},_bringToFront:function(){this._updateZIndex(this.options.riseOffset)},_resetZIndex:function(){this._updateZIndex(0)},_getPopupAnchor:function(){return this.options.icon.options.popupAnchor},_getTooltipAnchor:function(){return this.options.icon.options.tooltipAnchor}});var Oe=Se.extend({options:{stroke:!0,color:"#3388ff",weight:3,opacity:1,lineCap:"round",lineJoin:"round",dashArray:null,dashOffset:null,fill:!1,fillColor:null,fillOpacity:.2,fillRule:"evenodd",interactive:!0,bubblingMouseEvents:!0},beforeAdd:function(t){this._renderer=t.getRenderer(this)},onAdd:function(){this._renderer._initPath(this),this._reset(),this._renderer._addPath(this)},onRemove:function(){this._renderer._removePath(this)},redraw:function(){return this._map&&this._renderer._updatePath(this),this},setStyle:function(t){return p(this,t),this._renderer&&(this._renderer._updateStyle(this),this.options.stroke&&t.hasOwnProperty("weight")&&this._updateBounds()),this},bringToFront:function(){return this._renderer&&this._renderer._bringToFront(this),this},bringToBack:function(){return this._renderer&&this._renderer._bringToBack(this),this},getElement:function(){return this._path},_reset:function(){this._project(),this._update()},_clickTolerance:function(){return(this.options.stroke?this.options.weight/2:0)+this._renderer.options.tolerance}}),Re=Oe.extend({options:{fill:!0,radius:10},initialize:function(t,i){p(this,i),this._latlng=W(t),this._radius=this.options.radius},setLatLng:function(t){return this._latlng=W(t),this.redraw(),this.fire("move",{latlng:this._latlng})},getLatLng:function(){return this._latlng},setRadius:function(t){return this.options.radius=this._radius=t,this.redraw()},getRadius:function(){return this._radius},setStyle:function(t){var i=t&&t.radius||this._radius;return Oe.prototype.setStyle.call(this,t),this.setRadius(i),this},_project:function(){this._point=this._map.latLngToLayerPoint(this._latlng),this._updateBounds()},_updateBounds:function(){var t=this._radius,i=this._radiusY||t,e=this._clickTolerance(),n=[t+e,i+e];this._pxBounds=new O(this._point.subtract(n),this._point.add(n))},_update:function(){this._map&&this._updatePath()},_updatePath:function(){this._renderer._updateCircle(this)},_empty:function(){return this._radius&&!this._renderer._bounds.intersects(this._pxBounds)},_containsPoint:function(t){return t.distanceTo(this._point)<=this._radius+this._clickTolerance()}});var Ne=Re.extend({initialize:function(t,i,e){if("number"==typeof i&&(i=h({},e,{radius:i})),p(this,i),this._latlng=W(t),isNaN(this.options.radius))throw new Error("Circle radius cannot be NaN");this._mRadius=this.options.radius},setRadius:function(t){return this._mRadius=t,this.redraw()},getRadius:function(){return this._mRadius},getBounds:function(){var t=[this._radius,this._radiusY||this._radius];return new N(this._map.layerPointToLatLng(this._point.subtract(t)),this._map.layerPointToLatLng(this._point.add(t)))},setStyle:Oe.prototype.setStyle,_project:function(){var t=this._latlng.lng,i=this._latlng.lat,e=this._map,n=e.options.crs;if(n.distance===U.distance){var o=Math.PI/180,s=this._mRadius/U.R/o,r=e.project([i+s,t]),a=e.project([i-s,t]),h=r.add(a).divideBy(2),u=e.unproject(h).lat,l=Math.acos((Math.cos(s*o)-Math.sin(i*o)*Math.sin(u*o))/(Math.cos(i*o)*Math.cos(u*o)))/o;!isNaN(l)&&0!==l||(l=s/Math.cos(Math.PI/180*i)),this._point=h.subtract(e.getPixelOrigin()),this._radius=isNaN(l)?0:h.x-e.project([u,t-l]).x,this._radiusY=h.y-r.y}else{var c=n.unproject(n.project(this._latlng).subtract([this._mRadius,0]));this._point=e.latLngToLayerPoint(this._latlng),this._radius=this._point.x-e.latLngToLayerPoint(c).x}this._updateBounds()}});var De=Oe.extend({options:{smoothFactor:1,noClip:!1},initialize:function(t,i){p(this,i),this._setLatLngs(t)},getLatLngs:function(){return this._latlngs},setLatLngs:function(t){return this._setLatLngs(t),this.redraw()},isEmpty:function(){return!this._latlngs.length},closestLayerPoint:function(t){for(var i,e,n=1/0,o=null,s=fe,r=0,a=this._parts.length;r<a;r++)for(var h=this._parts[r],u=1,l=h.length;u<l;u++){var c=s(t,i=h[u-1],e=h[u],!0);c<n&&(n=c,o=s(t,i,e))}return o&&(o.distance=Math.sqrt(n)),o},getCenter:function(){if(!this._map)throw new Error("Must add layer to map before using getCenter()");var t,i,e,n,o,s,r,a=this._rings[0],h=a.length;if(!h)return null;for(i=t=0;t<h-1;t++)i+=a[t].distanceTo(a[t+1])/2;if(0===i)return this._map.layerPointToLatLng(a[0]);for(n=t=0;t<h-1;t++)if(o=a[t],s=a[t+1],i<(n+=e=o.distanceTo(s)))return r=(n-i)/e,this._map.layerPointToLatLng([s.x-r*(s.x-o.x),s.y-r*(s.y-o.y)])},getBounds:function(){return this._bounds},addLatLng:function(t,i){return i=i||this._defaultShape(),t=W(t),i.push(t),this._bounds.extend(t),this.redraw()},_setLatLngs:function(t){this._bounds=new N,this._latlngs=this._convertLatLngs(t)},_defaultShape:function(){return ge(this._latlngs)?this._latlngs:this._latlngs[0]},_convertLatLngs:function(t){for(var i=[],e=ge(t),n=0,o=t.length;n<o;n++)e?(i[n]=W(t[n]),this._bounds.extend(i[n])):i[n]=this._convertLatLngs(t[n]);return i},_project:function(){var t=new O;this._rings=[],this._projectLatlngs(this._latlngs,this._rings,t),this._bounds.isValid()&&t.isValid()&&(this._rawPxBounds=t,this._updateBounds())},_updateBounds:function(){var t=this._clickTolerance(),i=new B(t,t);this._pxBounds=new O([this._rawPxBounds.min.subtract(i),this._rawPxBounds.max.add(i)])},_projectLatlngs:function(t,i,e){var n,o,s=t[0]instanceof j,r=t.length;if(s){for(o=[],n=0;n<r;n++)o[n]=this._map.latLngToLayerPoint(t[n]),e.extend(o[n]);i.push(o)}else for(n=0;n<r;n++)this._projectLatlngs(t[n],i,e)},_clipPoints:function(){var t=this._renderer._bounds;if(this._parts=[],this._pxBounds&&this._pxBounds.intersects(t))if(this.options.noClip)this._parts=this._rings;else{var i,e,n,o,s,r,a,h=this._parts;for(n=i=0,o=this._rings.length;i<o;i++)for(e=0,s=(a=this._rings[i]).length;e<s-1;e++)(r=de(a[e],a[e+1],t,e,!0))&&(h[n]=h[n]||[],h[n].push(r[0]),r[1]===a[e+1]&&e!==s-2||(h[n].push(r[1]),n++))}},_simplifyPoints:function(){for(var t=this._parts,i=this.options.smoothFactor,e=0,n=t.length;e<n;e++)t[e]=ce(t[e],i)},_update:function(){this._map&&(this._clipPoints(),this._simplifyPoints(),this._updatePath())},_updatePath:function(){this._renderer._updatePoly(this)},_containsPoint:function(t,i){var e,n,o,s,r,a,h=this._clickTolerance();if(!this._pxBounds||!this._pxBounds.contains(t))return!1;for(e=0,s=this._parts.length;e<s;e++)for(n=0,o=(r=(a=this._parts[e]).length)-1;n<r;o=n++)if((i||0!==n)&&_e(t,a[o],a[n])<=h)return!0;return!1}});De._flat=ve;var je=De.extend({options:{fill:!0},isEmpty:function(){return!this._latlngs.length||!this._latlngs[0].length},getCenter:function(){if(!this._map)throw new Error("Must add layer to map before using getCenter()");var t,i,e,n,o,s,r,a,h,u=this._rings[0],l=u.length;if(!l)return null;for(s=r=a=0,t=0,i=l-1;t<l;i=t++)e=u[t],n=u[i],o=e.y*n.x-n.y*e.x,r+=(e.x+n.x)*o,a+=(e.y+n.y)*o,s+=3*o;return h=0===s?u[0]:[r/s,a/s],this._map.layerPointToLatLng(h)},_convertLatLngs:function(t){var i=De.prototype._convertLatLngs.call(this,t),e=i.length;return 2<=e&&i[0]instanceof j&&i[0].equals(i[e-1])&&i.pop(),i},_setLatLngs:function(t){De.prototype._setLatLngs.call(this,t),ge(this._latlngs)&&(this._latlngs=[this._latlngs])},_defaultShape:function(){return ge(this._latlngs[0])?this._latlngs[0]:this._latlngs[0][0]},_clipPoints:function(){var t=this._renderer._bounds,i=this.options.weight,e=new B(i,i);if(t=new O(t.min.subtract(e),t.max.add(e)),this._parts=[],this._pxBounds&&this._pxBounds.intersects(t))if(this.options.noClip)this._parts=this._rings;else for(var n,o=0,s=this._rings.length;o<s;o++)(n=xe(this._rings[o],t,!0)).length&&this._parts.push(n)},_updatePath:function(){this._renderer._updatePoly(this,!0)},_containsPoint:function(t){var i,e,n,o,s,r,a,h,u=!1;if(!this._pxBounds||!this._pxBounds.contains(t))return!1;for(o=0,a=this._parts.length;o<a;o++)for(s=0,r=(h=(i=this._parts[o]).length)-1;s<h;r=s++)e=i[s],n=i[r],e.y>t.y!=n.y>t.y&&t.x<(n.x-e.x)*(t.y-e.y)/(n.y-e.y)+e.x&&(u=!u);return u||De.prototype._containsPoint.call(this,t,!0)}});var We=Ee.extend({initialize:function(t,i){p(this,i),this._layers={},t&&this.addData(t)},addData:function(t){var i,e,n,o=v(t)?t:t.features;if(o){for(i=0,e=o.length;i<e;i++)((n=o[i]).geometries||n.geometry||n.features||n.coordinates)&&this.addData(n);return this}var s=this.options;if(s.filter&&!s.filter(t))return this;var r=He(t,s);return r?(r.feature=Ke(t),r.defaultOptions=r.options,this.resetStyle(r),s.onEachFeature&&s.onEachFeature(t,r),this.addLayer(r)):this},resetStyle:function(t){return t.options=h({},t.defaultOptions),this._setLayerStyle(t,this.options.style),this},setStyle:function(i){return this.eachLayer(function(t){this._setLayerStyle(t,i)},this)},_setLayerStyle:function(t,i){t.setStyle&&("function"==typeof i&&(i=i(t.feature)),t.setStyle(i))}});function He(t,i){var e,n,o,s,r="Feature"===t.type?t.geometry:t,a=r?r.coordinates:null,h=[],u=i&&i.pointToLayer,l=i&&i.coordsToLatLng||Fe;if(!a&&!r)return null;switch(r.type){case"Point":return e=l(a),u?u(t,e):new Ie(e);case"MultiPoint":for(o=0,s=a.length;o<s;o++)e=l(a[o]),h.push(u?u(t,e):new Ie(e));return new Ee(h);case"LineString":case"MultiLineString":return n=Ue(a,"LineString"===r.type?0:1,l),new De(n,i);case"Polygon":case"MultiPolygon":return n=Ue(a,"Polygon"===r.type?1:2,l),new je(n,i);case"GeometryCollection":for(o=0,s=r.geometries.length;o<s;o++){var c=He({geometry:r.geometries[o],type:"Feature",properties:t.properties},i);c&&h.push(c)}return new Ee(h);default:throw new Error("Invalid GeoJSON object.")}}function Fe(t){return new j(t[1],t[0],t[2])}function Ue(t,i,e){for(var n,o=[],s=0,r=t.length;s<r;s++)n=i?Ue(t[s],i-1,e):(e||Fe)(t[s]),o.push(n);return o}function Ve(t,i){return i="number"==typeof i?i:6,void 0!==t.alt?[c(t.lng,i),c(t.lat,i),c(t.alt,i)]:[c(t.lng,i),c(t.lat,i)]}function qe(t,i,e,n){for(var o=[],s=0,r=t.length;s<r;s++)o.push(i?qe(t[s],i-1,e,n):Ve(t[s],n));return!i&&e&&o.push(o[0]),o}function Ge(t,i){return t.feature?h({},t.feature,{geometry:i}):Ke(i)}function Ke(t){return"Feature"===t.type||"FeatureCollection"===t.type?t:{type:"Feature",properties:{},geometry:t}}var Ye={toGeoJSON:function(t){return Ge(this,{type:"Point",coordinates:Ve(this.getLatLng(),t)})}};function Xe(t,i){return new We(t,i)}Ie.include(Ye),Ne.include(Ye),Re.include(Ye),De.include({toGeoJSON:function(t){var i=!ge(this._latlngs);return Ge(this,{type:(i?"Multi":"")+"LineString",coordinates:qe(this._latlngs,i?1:0,!1,t)})}}),je.include({toGeoJSON:function(t){var i=!ge(this._latlngs),e=i&&!ge(this._latlngs[0]),n=qe(this._latlngs,e?2:i?1:0,!0,t);return i||(n=[n]),Ge(this,{type:(e?"Multi":"")+"Polygon",coordinates:n})}}),Ze.include({toMultiPoint:function(i){var e=[];return this.eachLayer(function(t){e.push(t.toGeoJSON(i).geometry.coordinates)}),Ge(this,{type:"MultiPoint",coordinates:e})},toGeoJSON:function(n){var t=this.feature&&this.feature.geometry&&this.feature.geometry.type;if("MultiPoint"===t)return this.toMultiPoint(n);var o="GeometryCollection"===t,s=[];return this.eachLayer(function(t){if(t.toGeoJSON){var i=t.toGeoJSON(n);if(o)s.push(i.geometry);else{var e=Ke(i);"FeatureCollection"===e.type?s.push.apply(s,e.features):s.push(e)}}}),o?Ge(this,{geometries:s,type:"GeometryCollection"}):{type:"FeatureCollection",features:s}}});var Je=Xe,$e=Se.extend({options:{opacity:1,alt:"",interactive:!1,crossOrigin:!1,errorOverlayUrl:"",zIndex:1,className:""},initialize:function(t,i,e){this._url=t,this._bounds=D(i),p(this,e)},onAdd:function(){this._image||(this._initImage(),this.options.opacity<1&&this._updateOpacity()),this.options.interactive&&(pi(this._image,"leaflet-interactive"),this.addInteractiveTarget(this._image)),this.getPane().appendChild(this._image),this._reset()},onRemove:function(){ui(this._image),this.options.interactive&&this.removeInteractiveTarget(this._image)},setOpacity:function(t){return this.options.opacity=t,this._image&&this._updateOpacity(),this},setStyle:function(t){return t.opacity&&this.setOpacity(t.opacity),this},bringToFront:function(){return this._map&&ci(this._image),this},bringToBack:function(){return this._map&&_i(this._image),this},setUrl:function(t){return this._url=t,this._image&&(this._image.src=t),this},setBounds:function(t){return this._bounds=D(t),this._map&&this._reset(),this},getEvents:function(){var t={zoom:this._reset,viewreset:this._reset};return this._zoomAnimated&&(t.zoomanim=this._animateZoom),t},setZIndex:function(t){return this.options.zIndex=t,this._updateZIndex(),this},getBounds:function(){return this._bounds},getElement:function(){return this._image},_initImage:function(){var t="IMG"===this._url.tagName,i=this._image=t?this._url:hi("img");pi(i,"leaflet-image-layer"),this._zoomAnimated&&pi(i,"leaflet-zoom-animated"),this.options.className&&pi(i,this.options.className),i.onselectstart=l,i.onmousemove=l,i.onload=a(this.fire,this,"load"),i.onerror=a(this._overlayOnError,this,"error"),!this.options.crossOrigin&&""!==this.options.crossOrigin||(i.crossOrigin=!0===this.options.crossOrigin?"":this.options.crossOrigin),this.options.zIndex&&this._updateZIndex(),t?this._url=i.src:(i.src=this._url,i.alt=this.options.alt)},_animateZoom:function(t){var i=this._map.getZoomScale(t.zoom),e=this._map._latLngBoundsToNewLayerBounds(this._bounds,t.zoom,t.center).min;xi(this._image,e,i)},_reset:function(){var t=this._image,i=new O(this._map.latLngToLayerPoint(this._bounds.getNorthWest()),this._map.latLngToLayerPoint(this._bounds.getSouthEast())),e=i.getSize();wi(t,i.min),t.style.width=e.x+"px",t.style.height=e.y+"px"},_updateOpacity:function(){vi(this._image,this.options.opacity)},_updateZIndex:function(){this._image&&void 0!==this.options.zIndex&&null!==this.options.zIndex&&(this._image.style.zIndex=this.options.zIndex)},_overlayOnError:function(){this.fire("error");var t=this.options.errorOverlayUrl;t&&this._url!==t&&(this._url=t,this._image.src=t)}}),Qe=$e.extend({options:{autoplay:!0,loop:!0,keepAspectRatio:!0},_initImage:function(){var t="VIDEO"===this._url.tagName,i=this._image=t?this._url:hi("video");if(pi(i,"leaflet-image-layer"),this._zoomAnimated&&pi(i,"leaflet-zoom-animated"),i.onselectstart=l,i.onmousemove=l,i.onloadeddata=a(this.fire,this,"load"),t){for(var e=i.getElementsByTagName("source"),n=[],o=0;o<e.length;o++)n.push(e[o].src);this._url=0<e.length?n:[i.src]}else{v(this._url)||(this._url=[this._url]),!this.options.keepAspectRatio&&i.style.hasOwnProperty("objectFit")&&(i.style.objectFit="fill"),i.autoplay=!!this.options.autoplay,i.loop=!!this.options.loop;for(var s=0;s<this._url.length;s++){var r=hi("source");r.src=this._url[s],i.appendChild(r)}}}});var tn=$e.extend({_initImage:function(){var t=this._image=this._url;pi(t,"leaflet-image-layer"),this._zoomAnimated&&pi(t,"leaflet-zoom-animated"),t.onselectstart=l,t.onmousemove=l}});var en=Se.extend({options:{offset:[0,7],className:"",pane:"popupPane"},initialize:function(t,i){p(this,t),this._source=i},onAdd:function(t){this._zoomAnimated=t._zoomAnimated,this._container||this._initLayout(),t._fadeAnimated&&vi(this._container,0),clearTimeout(this._removeTimeout),this.getPane().appendChild(this._container),this.update(),t._fadeAnimated&&vi(this._container,1),this.bringToFront()},onRemove:function(t){t._fadeAnimated?(vi(this._container,0),this._removeTimeout=setTimeout(a(ui,void 0,this._container),200)):ui(this._container)},getLatLng:function(){return this._latlng},setLatLng:function(t){return this._latlng=W(t),this._map&&(this._updatePosition(),this._adjustPan()),this},getContent:function(){return this._content},setContent:function(t){return this._content=t,this.update(),this},getElement:function(){return this._container},update:function(){this._map&&(this._container.style.visibility="hidden",this._updateContent(),this._updateLayout(),this._updatePosition(),this._container.style.visibility="",this._adjustPan())},getEvents:function(){var t={zoom:this._updatePosition,viewreset:this._updatePosition};return this._zoomAnimated&&(t.zoomanim=this._animateZoom),t},isOpen:function(){return!!this._map&&this._map.hasLayer(this)},bringToFront:function(){return this._map&&ci(this._container),this},bringToBack:function(){return this._map&&_i(this._container),this},_prepareOpen:function(t,i,e){if(i instanceof Se||(e=i,i=t),i instanceof Ee)for(var n in t._layers){i=t._layers[n];break}if(!e)if(i.getCenter)e=i.getCenter();else{if(!i.getLatLng)throw new Error("Unable to get source layer LatLng.");e=i.getLatLng()}return this._source=i,this.update(),e},_updateContent:function(){if(this._content){var t=this._contentNode,i="function"==typeof this._content?this._content(this._source||this):this._content;if("string"==typeof i)t.innerHTML=i;else{for(;t.hasChildNodes();)t.removeChild(t.firstChild);t.appendChild(i)}this.fire("contentupdate")}},_updatePosition:function(){if(this._map){var t=this._map.latLngToLayerPoint(this._latlng),i=I(this.options.offset),e=this._getAnchor();this._zoomAnimated?wi(this._container,t.add(e)):i=i.add(t).add(e);var n=this._containerBottom=-i.y,o=this._containerLeft=-Math.round(this._containerWidth/2)+i.x;this._container.style.bottom=n+"px",this._container.style.left=o+"px"}},_getAnchor:function(){return[0,0]}}),nn=en.extend({options:{maxWidth:300,minWidth:50,maxHeight:null,autoPan:!0,autoPanPaddingTopLeft:null,autoPanPaddingBottomRight:null,autoPanPadding:[5,5],keepInView:!1,closeButton:!0,autoClose:!0,closeOnEscapeKey:!0,className:""},openOn:function(t){return t.openPopup(this),this},onAdd:function(t){en.prototype.onAdd.call(this,t),t.fire("popupopen",{popup:this}),this._source&&(this._source.fire("popupopen",{popup:this},!0),this._source instanceof Oe||this._source.on("preclick",Oi))},onRemove:function(t){en.prototype.onRemove.call(this,t),t.fire("popupclose",{popup:this}),this._source&&(this._source.fire("popupclose",{popup:this},!0),this._source instanceof Oe||this._source.off("preclick",Oi))},getEvents:function(){var t=en.prototype.getEvents.call(this);return(void 0!==this.options.closeOnClick?this.options.closeOnClick:this._map.options.closePopupOnClick)&&(t.preclick=this._close),this.options.keepInView&&(t.moveend=this._adjustPan),t},_close:function(){this._map&&this._map.closePopup(this)},_initLayout:function(){var t="leaflet-popup",i=this._container=hi("div",t+" "+(this.options.className||"")+" leaflet-zoom-animated"),e=this._wrapper=hi("div",t+"-content-wrapper",i);if(this._contentNode=hi("div",t+"-content",e),Ni(e),Ri(this._contentNode),Ei(e,"contextmenu",Oi),this._tipContainer=hi("div",t+"-tip-container",i),this._tip=hi("div",t+"-tip",this._tipContainer),this.options.closeButton){var n=this._closeButton=hi("a",t+"-close-button",i);n.href="#close",n.innerHTML="&#215;",Ei(n,"click",this._onCloseButtonClick,this)}},_updateLayout:function(){var t=this._contentNode,i=t.style;i.width="",i.whiteSpace="nowrap";var e=t.offsetWidth;e=Math.min(e,this.options.maxWidth),e=Math.max(e,this.options.minWidth),i.width=e+1+"px",i.whiteSpace="",i.height="";var n=t.offsetHeight,o=this.options.maxHeight,s="leaflet-popup-scrolled";o&&o<n?(i.height=o+"px",pi(t,s)):mi(t,s),this._containerWidth=this._container.offsetWidth},_animateZoom:function(t){var i=this._map._latLngToNewLayerPoint(this._latlng,t.zoom,t.center),e=this._getAnchor();wi(this._container,i.add(e))},_adjustPan:function(){if(this.options.autoPan){this._map._panAnim&&this._map._panAnim.stop();var t=this._map,i=parseInt(ai(this._container,"marginBottom"),10)||0,e=this._container.offsetHeight+i,n=this._containerWidth,o=new B(this._containerLeft,-e-this._containerBottom);o._add(Pi(this._container));var s=t.layerPointToContainerPoint(o),r=I(this.options.autoPanPadding),a=I(this.options.autoPanPaddingTopLeft||r),h=I(this.options.autoPanPaddingBottomRight||r),u=t.getSize(),l=0,c=0;s.x+n+h.x>u.x&&(l=s.x+n-u.x+h.x),s.x-l-a.x<0&&(l=s.x-a.x),s.y+e+h.y>u.y&&(c=s.y+e-u.y+h.y),s.y-c-a.y<0&&(c=s.y-a.y),(l||c)&&t.fire("autopanstart").panBy([l,c])}},_onCloseButtonClick:function(t){this._close(),ji(t)},_getAnchor:function(){return I(this._source&&this._source._getPopupAnchor?this._source._getPopupAnchor():[0,0])}});Ji.mergeOptions({closePopupOnClick:!0}),Ji.include({openPopup:function(t,i,e){return t instanceof nn||(t=new nn(e).setContent(t)),i&&t.setLatLng(i),this.hasLayer(t)?this:(this._popup&&this._popup.options.autoClose&&this.closePopup(),this._popup=t,this.addLayer(t))},closePopup:function(t){return t&&t!==this._popup||(t=this._popup,this._popup=null),t&&this.removeLayer(t),this}}),Se.include({bindPopup:function(t,i){return t instanceof nn?(p(t,i),(this._popup=t)._source=this):(this._popup&&!i||(this._popup=new nn(i,this)),this._popup.setContent(t)),this._popupHandlersAdded||(this.on({click:this._openPopup,keypress:this._onKeyPress,remove:this.closePopup,move:this._movePopup}),this._popupHandlersAdded=!0),this},unbindPopup:function(){return this._popup&&(this.off({click:this._openPopup,keypress:this._onKeyPress,remove:this.closePopup,move:this._movePopup}),this._popupHandlersAdded=!1,this._popup=null),this},openPopup:function(t,i){return this._popup&&this._map&&(i=this._popup._prepareOpen(this,t,i),this._map.openPopup(this._popup,i)),this},closePopup:function(){return this._popup&&this._popup._close(),this},togglePopup:function(t){return this._popup&&(this._popup._map?this.closePopup():this.openPopup(t)),this},isPopupOpen:function(){return!!this._popup&&this._popup.isOpen()},setPopupContent:function(t){return this._popup&&this._popup.setContent(t),this},getPopup:function(){return this._popup},_openPopup:function(t){var i=t.layer||t.target;this._popup&&this._map&&(ji(t),i instanceof Oe?this.openPopup(t.layer||t.target,t.latlng):this._map.hasLayer(this._popup)&&this._popup._source===i?this.closePopup():this.openPopup(i,t.latlng))},_movePopup:function(t){this._popup.setLatLng(t.latlng)},_onKeyPress:function(t){13===t.originalEvent.keyCode&&this._openPopup(t)}});var on=en.extend({options:{pane:"tooltipPane",offset:[0,0],direction:"auto",permanent:!1,sticky:!1,interactive:!1,opacity:.9},onAdd:function(t){en.prototype.onAdd.call(this,t),this.setOpacity(this.options.opacity),t.fire("tooltipopen",{tooltip:this}),this._source&&this._source.fire("tooltipopen",{tooltip:this},!0)},onRemove:function(t){en.prototype.onRemove.call(this,t),t.fire("tooltipclose",{tooltip:this}),this._source&&this._source.fire("tooltipclose",{tooltip:this},!0)},getEvents:function(){var t=en.prototype.getEvents.call(this);return Tt&&!this.options.permanent&&(t.preclick=this._close),t},_close:function(){this._map&&this._map.closeTooltip(this)},_initLayout:function(){var t="leaflet-tooltip "+(this.options.className||"")+" leaflet-zoom-"+(this._zoomAnimated?"animated":"hide");this._contentNode=this._container=hi("div",t)},_updateLayout:function(){},_adjustPan:function(){},_setPosition:function(t){var i=this._map,e=this._container,n=i.latLngToContainerPoint(i.getCenter()),o=i.layerPointToContainerPoint(t),s=this.options.direction,r=e.offsetWidth,a=e.offsetHeight,h=I(this.options.offset),u=this._getAnchor();t="top"===s?t.add(I(-r/2+h.x,-a+h.y+u.y,!0)):"bottom"===s?t.subtract(I(r/2-h.x,-h.y,!0)):"center"===s?t.subtract(I(r/2+h.x,a/2-u.y+h.y,!0)):"right"===s||"auto"===s&&o.x<n.x?(s="right",t.add(I(h.x+u.x,u.y-a/2+h.y,!0))):(s="left",t.subtract(I(r+u.x-h.x,a/2-u.y-h.y,!0))),mi(e,"leaflet-tooltip-right"),mi(e,"leaflet-tooltip-left"),mi(e,"leaflet-tooltip-top"),mi(e,"leaflet-tooltip-bottom"),pi(e,"leaflet-tooltip-"+s),wi(e,t)},_updatePosition:function(){var t=this._map.latLngToLayerPoint(this._latlng);this._setPosition(t)},setOpacity:function(t){this.options.opacity=t,this._container&&vi(this._container,t)},_animateZoom:function(t){var i=this._map._latLngToNewLayerPoint(this._latlng,t.zoom,t.center);this._setPosition(i)},_getAnchor:function(){return I(this._source&&this._source._getTooltipAnchor&&!this.options.sticky?this._source._getTooltipAnchor():[0,0])}});Ji.include({openTooltip:function(t,i,e){return t instanceof on||(t=new on(e).setContent(t)),i&&t.setLatLng(i),this.hasLayer(t)?this:this.addLayer(t)},closeTooltip:function(t){return t&&this.removeLayer(t),this}}),Se.include({bindTooltip:function(t,i){return t instanceof on?(p(t,i),(this._tooltip=t)._source=this):(this._tooltip&&!i||(this._tooltip=new on(i,this)),this._tooltip.setContent(t)),this._initTooltipInteractions(),this._tooltip.options.permanent&&this._map&&this._map.hasLayer(this)&&this.openTooltip(),this},unbindTooltip:function(){return this._tooltip&&(this._initTooltipInteractions(!0),this.closeTooltip(),this._tooltip=null),this},_initTooltipInteractions:function(t){if(t||!this._tooltipHandlersAdded){var i=t?"off":"on",e={remove:this.closeTooltip,move:this._moveTooltip};this._tooltip.options.permanent?e.add=this._openTooltip:(e.mouseover=this._openTooltip,e.mouseout=this.closeTooltip,this._tooltip.options.sticky&&(e.mousemove=this._moveTooltip),Tt&&(e.click=this._openTooltip)),this[i](e),this._tooltipHandlersAdded=!t}},openTooltip:function(t,i){return this._tooltip&&this._map&&(i=this._tooltip._prepareOpen(this,t,i),this._map.openTooltip(this._tooltip,i),this._tooltip.options.interactive&&this._tooltip._container&&(pi(this._tooltip._container,"leaflet-clickable"),this.addInteractiveTarget(this._tooltip._container))),this},closeTooltip:function(){return this._tooltip&&(this._tooltip._close(),this._tooltip.options.interactive&&this._tooltip._container&&(mi(this._tooltip._container,"leaflet-clickable"),this.removeInteractiveTarget(this._tooltip._container))),this},toggleTooltip:function(t){return this._tooltip&&(this._tooltip._map?this.closeTooltip():this.openTooltip(t)),this},isTooltipOpen:function(){return this._tooltip.isOpen()},setTooltipContent:function(t){return this._tooltip&&this._tooltip.setContent(t),this},getTooltip:function(){return this._tooltip},_openTooltip:function(t){var i=t.layer||t.target;this._tooltip&&this._map&&this.openTooltip(i,this._tooltip.options.sticky?t.latlng:void 0)},_moveTooltip:function(t){var i,e,n=t.latlng;this._tooltip.options.sticky&&t.originalEvent&&(i=this._map.mouseEventToContainerPoint(t.originalEvent),e=this._map.containerPointToLayerPoint(i),n=this._map.layerPointToLatLng(e)),this._tooltip.setLatLng(n)}});var sn=ke.extend({options:{iconSize:[12,12],html:!1,bgPos:null,className:"leaflet-div-icon"},createIcon:function(t){var i=t&&"DIV"===t.tagName?t:document.createElement("div"),e=this.options;if(e.html instanceof Element?(li(i),i.appendChild(e.html)):i.innerHTML=!1!==e.html?e.html:"",e.bgPos){var n=I(e.bgPos);i.style.backgroundPosition=-n.x+"px "+-n.y+"px"}return this._setIconStyles(i,"icon"),i},createShadow:function(){return null}});ke.Default=Be;var rn=Se.extend({options:{tileSize:256,opacity:1,updateWhenIdle:xt,updateWhenZooming:!0,updateInterval:200,zIndex:1,bounds:null,minZoom:0,maxZoom:void 0,maxNativeZoom:void 0,minNativeZoom:void 0,noWrap:!1,pane:"tilePane",className:"",keepBuffer:2},initialize:function(t){p(this,t)},onAdd:function(){this._initContainer(),this._levels={},this._tiles={},this._resetView(),this._update()},beforeAdd:function(t){t._addZoomLimit(this)},onRemove:function(t){this._removeAllTiles(),ui(this._container),t._removeZoomLimit(this),this._container=null,this._tileZoom=void 0},bringToFront:function(){return this._map&&(ci(this._container),this._setAutoZIndex(Math.max)),this},bringToBack:function(){return this._map&&(_i(this._container),this._setAutoZIndex(Math.min)),this},getContainer:function(){return this._container},setOpacity:function(t){return this.options.opacity=t,this._updateOpacity(),this},setZIndex:function(t){return this.options.zIndex=t,this._updateZIndex(),this},isLoading:function(){return this._loading},redraw:function(){return this._map&&(this._removeAllTiles(),this._update()),this},getEvents:function(){var t={viewprereset:this._invalidateAll,viewreset:this._resetView,zoom:this._resetView,moveend:this._onMoveEnd};return this.options.updateWhenIdle||(this._onMove||(this._onMove=o(this._onMoveEnd,this.options.updateInterval,this)),t.move=this._onMove),this._zoomAnimated&&(t.zoomanim=this._animateZoom),t},createTile:function(){return document.createElement("div")},getTileSize:function(){var t=this.options.tileSize;return t instanceof B?t:new B(t,t)},_updateZIndex:function(){this._container&&void 0!==this.options.zIndex&&null!==this.options.zIndex&&(this._container.style.zIndex=this.options.zIndex)},_setAutoZIndex:function(t){for(var i,e=this.getPane().children,n=-t(-1/0,1/0),o=0,s=e.length;o<s;o++)i=e[o].style.zIndex,e[o]!==this._container&&i&&(n=t(n,+i));isFinite(n)&&(this.options.zIndex=n+t(-1,1),this._updateZIndex())},_updateOpacity:function(){if(this._map&&!et){vi(this._container,this.options.opacity);var t=+new Date,i=!1,e=!1;for(var n in this._tiles){var o=this._tiles[n];if(o.current&&o.loaded){var s=Math.min(1,(t-o.loaded)/200);vi(o.el,s),s<1?i=!0:(o.active?e=!0:this._onOpaqueTile(o),o.active=!0)}}e&&!this._noPrune&&this._pruneTiles(),i&&(C(this._fadeFrame),this._fadeFrame=M(this._updateOpacity,this))}},_onOpaqueTile:l,_initContainer:function(){this._container||(this._container=hi("div","leaflet-layer "+(this.options.className||"")),this._updateZIndex(),this.options.opacity<1&&this._updateOpacity(),this.getPane().appendChild(this._container))},_updateLevels:function(){var t=this._tileZoom,i=this.options.maxZoom;if(void 0!==t){for(var e in this._levels)this._levels[e].el.children.length||e===t?(this._levels[e].el.style.zIndex=i-Math.abs(t-e),this._onUpdateLevel(e)):(ui(this._levels[e].el),this._removeTilesAtZoom(e),this._onRemoveLevel(e),delete this._levels[e]);var n=this._levels[t],o=this._map;return n||((n=this._levels[t]={}).el=hi("div","leaflet-tile-container leaflet-zoom-animated",this._container),n.el.style.zIndex=i,n.origin=o.project(o.unproject(o.getPixelOrigin()),t).round(),n.zoom=t,this._setZoomTransform(n,o.getCenter(),o.getZoom()),n.el.offsetWidth,this._onCreateLevel(n)),this._level=n}},_onUpdateLevel:l,_onRemoveLevel:l,_onCreateLevel:l,_pruneTiles:function(){if(this._map){var t,i,e=this._map.getZoom();if(e>this.options.maxZoom||e<this.options.minZoom)this._removeAllTiles();else{for(t in this._tiles)(i=this._tiles[t]).retain=i.current;for(t in this._tiles)if((i=this._tiles[t]).current&&!i.active){var n=i.coords;this._retainParent(n.x,n.y,n.z,n.z-5)||this._retainChildren(n.x,n.y,n.z,n.z+2)}for(t in this._tiles)this._tiles[t].retain||this._removeTile(t)}}},_removeTilesAtZoom:function(t){for(var i in this._tiles)this._tiles[i].coords.z===t&&this._removeTile(i)},_removeAllTiles:function(){for(var t in this._tiles)this._removeTile(t)},_invalidateAll:function(){for(var t in this._levels)ui(this._levels[t].el),this._onRemoveLevel(t),delete this._levels[t];this._removeAllTiles(),this._tileZoom=void 0},_retainParent:function(t,i,e,n){var o=Math.floor(t/2),s=Math.floor(i/2),r=e-1,a=new B(+o,+s);a.z=+r;var h=this._tileCoordsToKey(a),u=this._tiles[h];return u&&u.active?u.retain=!0:(u&&u.loaded&&(u.retain=!0),n<r&&this._retainParent(o,s,r,n))},_retainChildren:function(t,i,e,n){for(var o=2*t;o<2*t+2;o++)for(var s=2*i;s<2*i+2;s++){var r=new B(o,s);r.z=e+1;var a=this._tileCoordsToKey(r),h=this._tiles[a];h&&h.active?h.retain=!0:(h&&h.loaded&&(h.retain=!0),e+1<n&&this._retainChildren(o,s,e+1,n))}},_resetView:function(t){var i=t&&(t.pinch||t.flyTo);this._setView(this._map.getCenter(),this._map.getZoom(),i,i)},_animateZoom:function(t){this._setView(t.center,t.zoom,!0,t.noUpdate)},_clampZoom:function(t){var i=this.options;return void 0!==i.minNativeZoom&&t<i.minNativeZoom?i.minNativeZoom:void 0!==i.maxNativeZoom&&i.maxNativeZoom<t?i.maxNativeZoom:t},_setView:function(t,i,e,n){var o=this._clampZoom(Math.round(i));(void 0!==this.options.maxZoom&&o>this.options.maxZoom||void 0!==this.options.minZoom&&o<this.options.minZoom)&&(o=void 0);var s=this.options.updateWhenZooming&&o!==this._tileZoom;n&&!s||(this._tileZoom=o,this._abortLoading&&this._abortLoading(),this._updateLevels(),this._resetGrid(),void 0!==o&&this._update(t),e||this._pruneTiles(),this._noPrune=!!e),this._setZoomTransforms(t,i)},_setZoomTransforms:function(t,i){for(var e in this._levels)this._setZoomTransform(this._levels[e],t,i)},_setZoomTransform:function(t,i,e){var n=this._map.getZoomScale(e,t.zoom),o=t.origin.multiplyBy(n).subtract(this._map._getNewPixelOrigin(i,e)).round();yt?xi(t.el,o,n):wi(t.el,o)},_resetGrid:function(){var t=this._map,i=t.options.crs,e=this._tileSize=this.getTileSize(),n=this._tileZoom,o=this._map.getPixelWorldBounds(this._tileZoom);o&&(this._globalTileRange=this._pxBoundsToTileRange(o)),this._wrapX=i.wrapLng&&!this.options.noWrap&&[Math.floor(t.project([0,i.wrapLng[0]],n).x/e.x),Math.ceil(t.project([0,i.wrapLng[1]],n).x/e.y)],this._wrapY=i.wrapLat&&!this.options.noWrap&&[Math.floor(t.project([i.wrapLat[0],0],n).y/e.x),Math.ceil(t.project([i.wrapLat[1],0],n).y/e.y)]},_onMoveEnd:function(){this._map&&!this._map._animatingZoom&&this._update()},_getTiledPixelBounds:function(t){var i=this._map,e=i._animatingZoom?Math.max(i._animateToZoom,i.getZoom()):i.getZoom(),n=i.getZoomScale(e,this._tileZoom),o=i.project(t,this._tileZoom).floor(),s=i.getSize().divideBy(2*n);return new O(o.subtract(s),o.add(s))},_update:function(t){var i=this._map;if(i){var e=this._clampZoom(i.getZoom());if(void 0===t&&(t=i.getCenter()),void 0!==this._tileZoom){var n=this._getTiledPixelBounds(t),o=this._pxBoundsToTileRange(n),s=o.getCenter(),r=[],a=this.options.keepBuffer,h=new O(o.getBottomLeft().subtract([a,-a]),o.getTopRight().add([a,-a]));if(!(isFinite(o.min.x)&&isFinite(o.min.y)&&isFinite(o.max.x)&&isFinite(o.max.y)))throw new Error("Attempted to load an infinite number of tiles");for(var u in this._tiles){var l=this._tiles[u].coords;l.z===this._tileZoom&&h.contains(new B(l.x,l.y))||(this._tiles[u].current=!1)}if(1<Math.abs(e-this._tileZoom))this._setView(t,e);else{for(var c=o.min.y;c<=o.max.y;c++)for(var _=o.min.x;_<=o.max.x;_++){var d=new B(_,c);if(d.z=this._tileZoom,this._isValidTile(d)){var p=this._tiles[this._tileCoordsToKey(d)];p?p.current=!0:r.push(d)}}if(r.sort(function(t,i){return t.distanceTo(s)-i.distanceTo(s)}),0!==r.length){this._loading||(this._loading=!0,this.fire("loading"));var m=document.createDocumentFragment();for(_=0;_<r.length;_++)this._addTile(r[_],m);this._level.el.appendChild(m)}}}}},_isValidTile:function(t){var i=this._map.options.crs;if(!i.infinite){var e=this._globalTileRange;if(!i.wrapLng&&(t.x<e.min.x||t.x>e.max.x)||!i.wrapLat&&(t.y<e.min.y||t.y>e.max.y))return!1}if(!this.options.bounds)return!0;var n=this._tileCoordsToBounds(t);return D(this.options.bounds).overlaps(n)},_keyToBounds:function(t){return this._tileCoordsToBounds(this._keyToTileCoords(t))},_tileCoordsToNwSe:function(t){var i=this._map,e=this.getTileSize(),n=t.scaleBy(e),o=n.add(e);return[i.unproject(n,t.z),i.unproject(o,t.z)]},_tileCoordsToBounds:function(t){var i=this._tileCoordsToNwSe(t),e=new N(i[0],i[1]);return this.options.noWrap||(e=this._map.wrapLatLngBounds(e)),e},_tileCoordsToKey:function(t){return t.x+":"+t.y+":"+t.z},_keyToTileCoords:function(t){var i=t.split(":"),e=new B(+i[0],+i[1]);return e.z=+i[2],e},_removeTile:function(t){var i=this._tiles[t];i&&(ui(i.el),delete this._tiles[t],this.fire("tileunload",{tile:i.el,coords:this._keyToTileCoords(t)}))},_initTile:function(t){pi(t,"leaflet-tile");var i=this.getTileSize();t.style.width=i.x+"px",t.style.height=i.y+"px",t.onselectstart=l,t.onmousemove=l,et&&this.options.opacity<1&&vi(t,this.options.opacity),st&&!rt&&(t.style.WebkitBackfaceVisibility="hidden")},_addTile:function(t,i){var e=this._getTilePos(t),n=this._tileCoordsToKey(t),o=this.createTile(this._wrapCoords(t),a(this._tileReady,this,t));this._initTile(o),this.createTile.length<2&&M(a(this._tileReady,this,t,null,o)),wi(o,e),this._tiles[n]={el:o,coords:t,current:!0},i.appendChild(o),this.fire("tileloadstart",{tile:o,coords:t})},_tileReady:function(t,i,e){i&&this.fire("tileerror",{error:i,tile:e,coords:t});var n=this._tileCoordsToKey(t);(e=this._tiles[n])&&(e.loaded=+new Date,this._map._fadeAnimated?(vi(e.el,0),C(this._fadeFrame),this._fadeFrame=M(this._updateOpacity,this)):(e.active=!0,this._pruneTiles()),i||(pi(e.el,"leaflet-tile-loaded"),this.fire("tileload",{tile:e.el,coords:t})),this._noTilesToLoad()&&(this._loading=!1,this.fire("load"),et||!this._map._fadeAnimated?M(this._pruneTiles,this):setTimeout(a(this._pruneTiles,this),250)))},_getTilePos:function(t){return t.scaleBy(this.getTileSize()).subtract(this._level.origin)},_wrapCoords:function(t){var i=new B(this._wrapX?r(t.x,this._wrapX):t.x,this._wrapY?r(t.y,this._wrapY):t.y);return i.z=t.z,i},_pxBoundsToTileRange:function(t){var i=this.getTileSize();return new O(t.min.unscaleBy(i).floor(),t.max.unscaleBy(i).ceil().subtract([1,1]))},_noTilesToLoad:function(){for(var t in this._tiles)if(!this._tiles[t].loaded)return!1;return!0}});var an=rn.extend({options:{minZoom:0,maxZoom:18,subdomains:"abc",errorTileUrl:"",zoomOffset:0,tms:!1,zoomReverse:!1,detectRetina:!1,crossOrigin:!1},initialize:function(t,i){this._url=t,(i=p(this,i)).detectRetina&&Ct&&0<i.maxZoom&&(i.tileSize=Math.floor(i.tileSize/2),i.zoomReverse?(i.zoomOffset--,i.minZoom++):(i.zoomOffset++,i.maxZoom--),i.minZoom=Math.max(0,i.minZoom)),"string"==typeof i.subdomains&&(i.subdomains=i.subdomains.split("")),st||this.on("tileunload",this._onTileRemove)},setUrl:function(t,i){return this._url===t&&void 0===i&&(i=!0),this._url=t,i||this.redraw(),this},createTile:function(t,i){var e=document.createElement("img");return Ei(e,"load",a(this._tileOnLoad,this,i,e)),Ei(e,"error",a(this._tileOnError,this,i,e)),!this.options.crossOrigin&&""!==this.options.crossOrigin||(e.crossOrigin=!0===this.options.crossOrigin?"":this.options.crossOrigin),e.alt="",e.setAttribute("role","presentation"),e.src=this.getTileUrl(t),e},getTileUrl:function(t){var i={r:Ct?"@2x":"",s:this._getSubdomain(t),x:t.x,y:t.y,z:this._getZoomForUrl()};if(this._map&&!this._map.options.crs.infinite){var e=this._globalTileRange.max.y-t.y;this.options.tms&&(i.y=e),i["-y"]=e}return g(this._url,h(i,this.options))},_tileOnLoad:function(t,i){et?setTimeout(a(t,this,null,i),0):t(null,i)},_tileOnError:function(t,i,e){var n=this.options.errorTileUrl;n&&i.getAttribute("src")!==n&&(i.src=n),t(e,i)},_onTileRemove:function(t){t.tile.onload=null},_getZoomForUrl:function(){var t=this._tileZoom,i=this.options.maxZoom;return this.options.zoomReverse&&(t=i-t),t+this.options.zoomOffset},_getSubdomain:function(t){var i=Math.abs(t.x+t.y)%this.options.subdomains.length;return this.options.subdomains[i]},_abortLoading:function(){var t,i;for(t in this._tiles)this._tiles[t].coords.z!==this._tileZoom&&((i=this._tiles[t].el).onload=l,i.onerror=l,i.complete||(i.src=x,ui(i),delete this._tiles[t]))},_removeTile:function(t){var i=this._tiles[t];if(i)return ht||i.el.setAttribute("src",x),rn.prototype._removeTile.call(this,t)},_tileReady:function(t,i,e){if(this._map&&(!e||e.getAttribute("src")!==x))return rn.prototype._tileReady.call(this,t,i,e)}});function hn(t,i){return new an(t,i)}var un=an.extend({defaultWmsParams:{service:"WMS",request:"GetMap",layers:"",styles:"",format:"image/jpeg",transparent:!1,version:"1.1.1"},options:{crs:null,uppercase:!1},initialize:function(t,i){this._url=t;var e=h({},this.defaultWmsParams);for(var n in i)n in this.options||(e[n]=i[n]);var o=(i=p(this,i)).detectRetina&&Ct?2:1,s=this.getTileSize();e.width=s.x*o,e.height=s.y*o,this.wmsParams=e},onAdd:function(t){this._crs=this.options.crs||t.options.crs,this._wmsVersion=parseFloat(this.wmsParams.version);var i=1.3<=this._wmsVersion?"crs":"srs";this.wmsParams[i]=this._crs.code,an.prototype.onAdd.call(this,t)},getTileUrl:function(t){var i=this._tileCoordsToNwSe(t),e=this._crs,n=R(e.project(i[0]),e.project(i[1])),o=n.min,s=n.max,r=(1.3<=this._wmsVersion&&this._crs===Me?[o.y,o.x,s.y,s.x]:[o.x,o.y,s.x,s.y]).join(","),a=an.prototype.getTileUrl.call(this,t);return a+m(this.wmsParams,a,this.options.uppercase)+(this.options.uppercase?"&BBOX=":"&bbox=")+r},setParams:function(t,i){return h(this.wmsParams,t),i||this.redraw(),this}});an.WMS=un,hn.wms=function(t,i){return new un(t,i)};var ln=Se.extend({options:{padding:.1,tolerance:0},initialize:function(t){p(this,t),u(this),this._layers=this._layers||{}},onAdd:function(){this._container||(this._initContainer(),this._zoomAnimated&&pi(this._container,"leaflet-zoom-animated")),this.getPane().appendChild(this._container),this._update(),this.on("update",this._updatePaths,this)},onRemove:function(){this.off("update",this._updatePaths,this),this._destroyContainer()},getEvents:function(){var t={viewreset:this._reset,zoom:this._onZoom,moveend:this._update,zoomend:this._onZoomEnd};return this._zoomAnimated&&(t.zoomanim=this._onAnimZoom),t},_onAnimZoom:function(t){this._updateTransform(t.center,t.zoom)},_onZoom:function(){this._updateTransform(this._map.getCenter(),this._map.getZoom())},_updateTransform:function(t,i){var e=this._map.getZoomScale(i,this._zoom),n=Pi(this._container),o=this._map.getSize().multiplyBy(.5+this.options.padding),s=this._map.project(this._center,i),r=this._map.project(t,i).subtract(s),a=o.multiplyBy(-e).add(n).add(o).subtract(r);yt?xi(this._container,a,e):wi(this._container,a)},_reset:function(){for(var t in this._update(),this._updateTransform(this._center,this._zoom),this._layers)this._layers[t]._reset()},_onZoomEnd:function(){for(var t in this._layers)this._layers[t]._project()},_updatePaths:function(){for(var t in this._layers)this._layers[t]._update()},_update:function(){var t=this.options.padding,i=this._map.getSize(),e=this._map.containerPointToLayerPoint(i.multiplyBy(-t)).round();this._bounds=new O(e,e.add(i.multiplyBy(1+2*t)).round()),this._center=this._map.getCenter(),this._zoom=this._map.getZoom()}}),cn=ln.extend({getEvents:function(){var t=ln.prototype.getEvents.call(this);return t.viewprereset=this._onViewPreReset,t},_onViewPreReset:function(){this._postponeUpdatePaths=!0},onAdd:function(){ln.prototype.onAdd.call(this),this._draw()},_initContainer:function(){var t=this._container=document.createElement("canvas");Ei(t,"mousemove",o(this._onMouseMove,32,this),this),Ei(t,"click dblclick mousedown mouseup contextmenu",this._onClick,this),Ei(t,"mouseout",this._handleMouseOut,this),this._ctx=t.getContext("2d")},_destroyContainer:function(){C(this._redrawRequest),delete this._ctx,ui(this._container),Bi(this._container),delete this._container},_updatePaths:function(){if(!this._postponeUpdatePaths){for(var t in this._redrawBounds=null,this._layers)this._layers[t]._update();this._redraw()}},_update:function(){if(!this._map._animatingZoom||!this._bounds){ln.prototype._update.call(this);var t=this._bounds,i=this._container,e=t.getSize(),n=Ct?2:1;wi(i,t.min),i.width=n*e.x,i.height=n*e.y,i.style.width=e.x+"px",i.style.height=e.y+"px",Ct&&this._ctx.scale(2,2),this._ctx.translate(-t.min.x,-t.min.y),this.fire("update")}},_reset:function(){ln.prototype._reset.call(this),this._postponeUpdatePaths&&(this._postponeUpdatePaths=!1,this._updatePaths())},_initPath:function(t){this._updateDashArray(t);var i=(this._layers[u(t)]=t)._order={layer:t,prev:this._drawLast,next:null};this._drawLast&&(this._drawLast.next=i),this._drawLast=i,this._drawFirst=this._drawFirst||this._drawLast},_addPath:function(t){this._requestRedraw(t)},_removePath:function(t){var i=t._order,e=i.next,n=i.prev;e?e.prev=n:this._drawLast=n,n?n.next=e:this._drawFirst=e,delete t._order,delete this._layers[u(t)],this._requestRedraw(t)},_updatePath:function(t){this._extendRedrawBounds(t),t._project(),t._update(),this._requestRedraw(t)},_updateStyle:function(t){this._updateDashArray(t),this._requestRedraw(t)},_updateDashArray:function(t){if("string"==typeof t.options.dashArray){var i,e,n=t.options.dashArray.split(/[, ]+/),o=[];for(e=0;e<n.length;e++){if(i=Number(n[e]),isNaN(i))return;o.push(i)}t.options._dashArray=o}else t.options._dashArray=t.options.dashArray},_requestRedraw:function(t){this._map&&(this._extendRedrawBounds(t),this._redrawRequest=this._redrawRequest||M(this._redraw,this))},_extendRedrawBounds:function(t){if(t._pxBounds){var i=(t.options.weight||0)+1;this._redrawBounds=this._redrawBounds||new O,this._redrawBounds.extend(t._pxBounds.min.subtract([i,i])),this._redrawBounds.extend(t._pxBounds.max.add([i,i]))}},_redraw:function(){this._redrawRequest=null,this._redrawBounds&&(this._redrawBounds.min._floor(),this._redrawBounds.max._ceil()),this._clear(),this._draw(),this._redrawBounds=null},_clear:function(){var t=this._redrawBounds;if(t){var i=t.getSize();this._ctx.clearRect(t.min.x,t.min.y,i.x,i.y)}else this._ctx.clearRect(0,0,this._container.width,this._container.height)},_draw:function(){var t,i=this._redrawBounds;if(this._ctx.save(),i){var e=i.getSize();this._ctx.beginPath(),this._ctx.rect(i.min.x,i.min.y,e.x,e.y),this._ctx.clip()}this._drawing=!0;for(var n=this._drawFirst;n;n=n.next)t=n.layer,(!i||t._pxBounds&&t._pxBounds.intersects(i))&&t._updatePath();this._drawing=!1,this._ctx.restore()},_updatePoly:function(t,i){if(this._drawing){var e,n,o,s,r=t._parts,a=r.length,h=this._ctx;if(a){for(h.beginPath(),e=0;e<a;e++){for(n=0,o=r[e].length;n<o;n++)s=r[e][n],h[n?"lineTo":"moveTo"](s.x,s.y);i&&h.closePath()}this._fillStroke(h,t)}}},_updateCircle:function(t){if(this._drawing&&!t._empty()){var i=t._point,e=this._ctx,n=Math.max(Math.round(t._radius),1),o=(Math.max(Math.round(t._radiusY),1)||n)/n;1!=o&&(e.save(),e.scale(1,o)),e.beginPath(),e.arc(i.x,i.y/o,n,0,2*Math.PI,!1),1!=o&&e.restore(),this._fillStroke(e,t)}},_fillStroke:function(t,i){var e=i.options;e.fill&&(t.globalAlpha=e.fillOpacity,t.fillStyle=e.fillColor||e.color,t.fill(e.fillRule||"evenodd")),e.stroke&&0!==e.weight&&(t.setLineDash&&t.setLineDash(i.options&&i.options._dashArray||[]),t.globalAlpha=e.opacity,t.lineWidth=e.weight,t.strokeStyle=e.color,t.lineCap=e.lineCap,t.lineJoin=e.lineJoin,t.stroke())},_onClick:function(t){for(var i,e,n=this._map.mouseEventToLayerPoint(t),o=this._drawFirst;o;o=o.next)(i=o.layer).options.interactive&&i._containsPoint(n)&&!this._map._draggableMoved(i)&&(e=i);e&&(qi(t),this._fireEvent([e],t))},_onMouseMove:function(t){if(this._map&&!this._map.dragging.moving()&&!this._map._animatingZoom){var i=this._map.mouseEventToLayerPoint(t);this._handleMouseHover(t,i)}},_handleMouseOut:function(t){var i=this._hoveredLayer;i&&(mi(this._container,"leaflet-interactive"),this._fireEvent([i],t,"mouseout"),this._hoveredLayer=null)},_handleMouseHover:function(t,i){for(var e,n,o=this._drawFirst;o;o=o.next)(e=o.layer).options.interactive&&e._containsPoint(i)&&(n=e);n!==this._hoveredLayer&&(this._handleMouseOut(t),n&&(pi(this._container,"leaflet-interactive"),this._fireEvent([n],t,"mouseover"),this._hoveredLayer=n)),this._hoveredLayer&&this._fireEvent([this._hoveredLayer],t)},_fireEvent:function(t,i,e){this._map._fireDOMEvent(i,e||i.type,t)},_bringToFront:function(t){var i=t._order;if(i){var e=i.next,n=i.prev;e&&((e.prev=n)?n.next=e:e&&(this._drawFirst=e),i.prev=this._drawLast,(this._drawLast.next=i).next=null,this._drawLast=i,this._requestRedraw(t))}},_bringToBack:function(t){var i=t._order;if(i){var e=i.next,n=i.prev;n&&((n.next=e)?e.prev=n:n&&(this._drawLast=n),i.prev=null,i.next=this._drawFirst,this._drawFirst.prev=i,this._drawFirst=i,this._requestRedraw(t))}}});function _n(t){return St?new cn(t):null}var dn=function(){try{return document.namespaces.add("lvml","urn:schemas-microsoft-com:vml"),function(t){return document.createElement("<lvml:"+t+' class="lvml">')}}catch(t){return function(t){return document.createElement("<"+t+' xmlns="urn:schemas-microsoft.com:vml" class="lvml">')}}}(),pn={_initContainer:function(){this._container=hi("div","leaflet-vml-container")},_update:function(){this._map._animatingZoom||(ln.prototype._update.call(this),this.fire("update"))},_initPath:function(t){var i=t._container=dn("shape");pi(i,"leaflet-vml-shape "+(this.options.className||"")),i.coordsize="1 1",t._path=dn("path"),i.appendChild(t._path),this._updateStyle(t),this._layers[u(t)]=t},_addPath:function(t){var i=t._container;this._container.appendChild(i),t.options.interactive&&t.addInteractiveTarget(i)},_removePath:function(t){var i=t._container;ui(i),t.removeInteractiveTarget(i),delete this._layers[u(t)]},_updateStyle:function(t){var i=t._stroke,e=t._fill,n=t.options,o=t._container;o.stroked=!!n.stroke,o.filled=!!n.fill,n.stroke?(i||(i=t._stroke=dn("stroke")),o.appendChild(i),i.weight=n.weight+"px",i.color=n.color,i.opacity=n.opacity,n.dashArray?i.dashStyle=v(n.dashArray)?n.dashArray.join(" "):n.dashArray.replace(/( *, *)/g," "):i.dashStyle="",i.endcap=n.lineCap.replace("butt","flat"),i.joinstyle=n.lineJoin):i&&(o.removeChild(i),t._stroke=null),n.fill?(e||(e=t._fill=dn("fill")),o.appendChild(e),e.color=n.fillColor||n.color,e.opacity=n.fillOpacity):e&&(o.removeChild(e),t._fill=null)},_updateCircle:function(t){var i=t._point.round(),e=Math.round(t._radius),n=Math.round(t._radiusY||e);this._setPath(t,t._empty()?"M0 0":"AL "+i.x+","+i.y+" "+e+","+n+" 0,23592600")},_setPath:function(t,i){t._path.v=i},_bringToFront:function(t){ci(t._container)},_bringToBack:function(t){_i(t._container)}},mn=Et?dn:$,fn=ln.extend({getEvents:function(){var t=ln.prototype.getEvents.call(this);return t.zoomstart=this._onZoomStart,t},_initContainer:function(){this._container=mn("svg"),this._container.setAttribute("pointer-events","none"),this._rootGroup=mn("g"),this._container.appendChild(this._rootGroup)},_destroyContainer:function(){ui(this._container),Bi(this._container),delete this._container,delete this._rootGroup,delete this._svgSize},_onZoomStart:function(){this._update()},_update:function(){if(!this._map._animatingZoom||!this._bounds){ln.prototype._update.call(this);var t=this._bounds,i=t.getSize(),e=this._container;this._svgSize&&this._svgSize.equals(i)||(this._svgSize=i,e.setAttribute("width",i.x),e.setAttribute("height",i.y)),wi(e,t.min),e.setAttribute("viewBox",[t.min.x,t.min.y,i.x,i.y].join(" ")),this.fire("update")}},_initPath:function(t){var i=t._path=mn("path");t.options.className&&pi(i,t.options.className),t.options.interactive&&pi(i,"leaflet-interactive"),this._updateStyle(t),this._layers[u(t)]=t},_addPath:function(t){this._rootGroup||this._initContainer(),this._rootGroup.appendChild(t._path),t.addInteractiveTarget(t._path)},_removePath:function(t){ui(t._path),t.removeInteractiveTarget(t._path),delete this._layers[u(t)]},_updatePath:function(t){t._project(),t._update()},_updateStyle:function(t){var i=t._path,e=t.options;i&&(e.stroke?(i.setAttribute("stroke",e.color),i.setAttribute("stroke-opacity",e.opacity),i.setAttribute("stroke-width",e.weight),i.setAttribute("stroke-linecap",e.lineCap),i.setAttribute("stroke-linejoin",e.lineJoin),e.dashArray?i.setAttribute("stroke-dasharray",e.dashArray):i.removeAttribute("stroke-dasharray"),e.dashOffset?i.setAttribute("stroke-dashoffset",e.dashOffset):i.removeAttribute("stroke-dashoffset")):i.setAttribute("stroke","none"),e.fill?(i.setAttribute("fill",e.fillColor||e.color),i.setAttribute("fill-opacity",e.fillOpacity),i.setAttribute("fill-rule",e.fillRule||"evenodd")):i.setAttribute("fill","none"))},_updatePoly:function(t,i){this._setPath(t,Q(t._parts,i))},_updateCircle:function(t){var i=t._point,e=Math.max(Math.round(t._radius),1),n="a"+e+","+(Math.max(Math.round(t._radiusY),1)||e)+" 0 1,0 ",o=t._empty()?"M0 0":"M"+(i.x-e)+","+i.y+n+2*e+",0 "+n+2*-e+",0 ";this._setPath(t,o)},_setPath:function(t,i){t._path.setAttribute("d",i)},_bringToFront:function(t){ci(t._path)},_bringToBack:function(t){_i(t._path)}});function gn(t){return Zt||Et?new fn(t):null}Et&&fn.include(pn),Ji.include({getRenderer:function(t){var i=t.options.renderer||this._getPaneRenderer(t.options.pane)||this.options.renderer||this._renderer;return i||(i=this._renderer=this._createRenderer()),this.hasLayer(i)||this.addLayer(i),i},_getPaneRenderer:function(t){if("overlayPane"===t||void 0===t)return!1;var i=this._paneRenderers[t];return void 0===i&&(i=this._createRenderer({pane:t}),this._paneRenderers[t]=i),i},_createRenderer:function(t){return this.options.preferCanvas&&_n(t)||gn(t)}});var vn=je.extend({initialize:function(t,i){je.prototype.initialize.call(this,this._boundsToLatLngs(t),i)},setBounds:function(t){return this.setLatLngs(this._boundsToLatLngs(t))},_boundsToLatLngs:function(t){return[(t=D(t)).getSouthWest(),t.getNorthWest(),t.getNorthEast(),t.getSouthEast()]}});fn.create=mn,fn.pointsToPath=Q,We.geometryToLayer=He,We.coordsToLatLng=Fe,We.coordsToLatLngs=Ue,We.latLngToCoords=Ve,We.latLngsToCoords=qe,We.getFeature=Ge,We.asFeature=Ke,Ji.mergeOptions({boxZoom:!0});var yn=oe.extend({initialize:function(t){this._map=t,this._container=t._container,this._pane=t._panes.overlayPane,this._resetStateTimeout=0,t.on("unload",this._destroy,this)},addHooks:function(){Ei(this._container,"mousedown",this._onMouseDown,this)},removeHooks:function(){Bi(this._container,"mousedown",this._onMouseDown,this)},moved:function(){return this._moved},_destroy:function(){ui(this._pane),delete this._pane},_resetState:function(){this._resetStateTimeout=0,this._moved=!1},_clearDeferredResetState:function(){0!==this._resetStateTimeout&&(clearTimeout(this._resetStateTimeout),this._resetStateTimeout=0)},_onMouseDown:function(t){if(!t.shiftKey||1!==t.which&&1!==t.button)return!1;this._clearDeferredResetState(),this._resetState(),$t(),bi(),this._startPoint=this._map.mouseEventToContainerPoint(t),Ei(document,{contextmenu:ji,mousemove:this._onMouseMove,mouseup:this._onMouseUp,keydown:this._onKeyDown},this)},_onMouseMove:function(t){this._moved||(this._moved=!0,this._box=hi("div","leaflet-zoom-box",this._container),pi(this._container,"leaflet-crosshair"),this._map.fire("boxzoomstart")),this._point=this._map.mouseEventToContainerPoint(t);var i=new O(this._point,this._startPoint),e=i.getSize();wi(this._box,i.min),this._box.style.width=e.x+"px",this._box.style.height=e.y+"px"},_finish:function(){this._moved&&(ui(this._box),mi(this._container,"leaflet-crosshair")),Qt(),Ti(),Bi(document,{contextmenu:ji,mousemove:this._onMouseMove,mouseup:this._onMouseUp,keydown:this._onKeyDown},this)},_onMouseUp:function(t){if((1===t.which||1===t.button)&&(this._finish(),this._moved)){this._clearDeferredResetState(),this._resetStateTimeout=setTimeout(a(this._resetState,this),0);var i=new N(this._map.containerPointToLatLng(this._startPoint),this._map.containerPointToLatLng(this._point));this._map.fitBounds(i).fire("boxzoomend",{boxZoomBounds:i})}},_onKeyDown:function(t){27===t.keyCode&&this._finish()}});Ji.addInitHook("addHandler","boxZoom",yn),Ji.mergeOptions({doubleClickZoom:!0});var xn=oe.extend({addHooks:function(){this._map.on("dblclick",this._onDoubleClick,this)},removeHooks:function(){this._map.off("dblclick",this._onDoubleClick,this)},_onDoubleClick:function(t){var i=this._map,e=i.getZoom(),n=i.options.zoomDelta,o=t.originalEvent.shiftKey?e-n:e+n;"center"===i.options.doubleClickZoom?i.setZoom(o):i.setZoomAround(t.containerPoint,o)}});Ji.addInitHook("addHandler","doubleClickZoom",xn),Ji.mergeOptions({dragging:!0,inertia:!rt,inertiaDeceleration:3400,inertiaMaxSpeed:1/0,easeLinearity:.2,worldCopyJump:!1,maxBoundsViscosity:0});var wn=oe.extend({addHooks:function(){if(!this._draggable){var t=this._map;this._draggable=new le(t._mapPane,t._container),this._draggable.on({dragstart:this._onDragStart,drag:this._onDrag,dragend:this._onDragEnd},this),this._draggable.on("predrag",this._onPreDragLimit,this),t.options.worldCopyJump&&(this._draggable.on("predrag",this._onPreDragWrap,this),t.on("zoomend",this._onZoomEnd,this),t.whenReady(this._onZoomEnd,this))}pi(this._map._container,"leaflet-grab leaflet-touch-drag"),this._draggable.enable(),this._positions=[],this._times=[]},removeHooks:function(){mi(this._map._container,"leaflet-grab"),mi(this._map._container,"leaflet-touch-drag"),this._draggable.disable()},moved:function(){return this._draggable&&this._draggable._moved},moving:function(){return this._draggable&&this._draggable._moving},_onDragStart:function(){var t=this._map;if(t._stop(),this._map.options.maxBounds&&this._map.options.maxBoundsViscosity){var i=D(this._map.options.maxBounds);this._offsetLimit=R(this._map.latLngToContainerPoint(i.getNorthWest()).multiplyBy(-1),this._map.latLngToContainerPoint(i.getSouthEast()).multiplyBy(-1).add(this._map.getSize())),this._viscosity=Math.min(1,Math.max(0,this._map.options.maxBoundsViscosity))}else this._offsetLimit=null;t.fire("movestart").fire("dragstart"),t.options.inertia&&(this._positions=[],this._times=[])},_onDrag:function(t){if(this._map.options.inertia){var i=this._lastTime=+new Date,e=this._lastPos=this._draggable._absPos||this._draggable._newPos;this._positions.push(e),this._times.push(i),this._prunePositions(i)}this._map.fire("move",t).fire("drag",t)},_prunePositions:function(t){for(;1<this._positions.length&&50<t-this._times[0];)this._positions.shift(),this._times.shift()},_onZoomEnd:function(){var t=this._map.getSize().divideBy(2),i=this._map.latLngToLayerPoint([0,0]);this._initialWorldOffset=i.subtract(t).x,this._worldWidth=this._map.getPixelWorldBounds().getSize().x},_viscousLimit:function(t,i){return t-(t-i)*this._viscosity},_onPreDragLimit:function(){if(this._viscosity&&this._offsetLimit){var t=this._draggable._newPos.subtract(this._draggable._startPos),i=this._offsetLimit;t.x<i.min.x&&(t.x=this._viscousLimit(t.x,i.min.x)),t.y<i.min.y&&(t.y=this._viscousLimit(t.y,i.min.y)),t.x>i.max.x&&(t.x=this._viscousLimit(t.x,i.max.x)),t.y>i.max.y&&(t.y=this._viscousLimit(t.y,i.max.y)),this._draggable._newPos=this._draggable._startPos.add(t)}},_onPreDragWrap:function(){var t=this._worldWidth,i=Math.round(t/2),e=this._initialWorldOffset,n=this._draggable._newPos.x,o=(n-i+e)%t+i-e,s=(n+i+e)%t-i-e,r=Math.abs(o+e)<Math.abs(s+e)?o:s;this._draggable._absPos=this._draggable._newPos.clone(),this._draggable._newPos.x=r},_onDragEnd:function(t){var i=this._map,e=i.options,n=!e.inertia||this._times.length<2;if(i.fire("dragend",t),n)i.fire("moveend");else{this._prunePositions(+new Date);var o=this._lastPos.subtract(this._positions[0]),s=(this._lastTime-this._times[0])/1e3,r=e.easeLinearity,a=o.multiplyBy(r/s),h=a.distanceTo([0,0]),u=Math.min(e.inertiaMaxSpeed,h),l=a.multiplyBy(u/h),c=u/(e.inertiaDeceleration*r),_=l.multiplyBy(-c/2).round();_.x||_.y?(_=i._limitOffset(_,i.options.maxBounds),M(function(){i.panBy(_,{duration:c,easeLinearity:r,noMoveStart:!0,animate:!0})})):i.fire("moveend")}}});Ji.addInitHook("addHandler","dragging",wn),Ji.mergeOptions({keyboard:!0,keyboardPanDelta:80});var Pn=oe.extend({keyCodes:{left:[37],right:[39],down:[40],up:[38],zoomIn:[187,107,61,171],zoomOut:[189,109,54,173]},initialize:function(t){this._map=t,this._setPanDelta(t.options.keyboardPanDelta),this._setZoomDelta(t.options.zoomDelta)},addHooks:function(){var t=this._map._container;t.tabIndex<=0&&(t.tabIndex="0"),Ei(t,{focus:this._onFocus,blur:this._onBlur,mousedown:this._onMouseDown},this),this._map.on({focus:this._addHooks,blur:this._removeHooks},this)},removeHooks:function(){this._removeHooks(),Bi(this._map._container,{focus:this._onFocus,blur:this._onBlur,mousedown:this._onMouseDown},this),this._map.off({focus:this._addHooks,blur:this._removeHooks},this)},_onMouseDown:function(){if(!this._focused){var t=document.body,i=document.documentElement,e=t.scrollTop||i.scrollTop,n=t.scrollLeft||i.scrollLeft;this._map._container.focus(),window.scrollTo(n,e)}},_onFocus:function(){this._focused=!0,this._map.fire("focus")},_onBlur:function(){this._focused=!1,this._map.fire("blur")},_setPanDelta:function(t){var i,e,n=this._panKeys={},o=this.keyCodes;for(i=0,e=o.left.length;i<e;i++)n[o.left[i]]=[-1*t,0];for(i=0,e=o.right.length;i<e;i++)n[o.right[i]]=[t,0];for(i=0,e=o.down.length;i<e;i++)n[o.down[i]]=[0,t];for(i=0,e=o.up.length;i<e;i++)n[o.up[i]]=[0,-1*t]},_setZoomDelta:function(t){var i,e,n=this._zoomKeys={},o=this.keyCodes;for(i=0,e=o.zoomIn.length;i<e;i++)n[o.zoomIn[i]]=t;for(i=0,e=o.zoomOut.length;i<e;i++)n[o.zoomOut[i]]=-t},_addHooks:function(){Ei(document,"keydown",this._onKeyDown,this)},_removeHooks:function(){Bi(document,"keydown",this._onKeyDown,this)},_onKeyDown:function(t){if(!(t.altKey||t.ctrlKey||t.metaKey)){var i,e=t.keyCode,n=this._map;if(e in this._panKeys)n._panAnim&&n._panAnim._inProgress||(i=this._panKeys[e],t.shiftKey&&(i=I(i).multiplyBy(3)),n.panBy(i),n.options.maxBounds&&n.panInsideBounds(n.options.maxBounds));else if(e in this._zoomKeys)n.setZoom(n.getZoom()+(t.shiftKey?3:1)*this._zoomKeys[e]);else{if(27!==e||!n._popup||!n._popup.options.closeOnEscapeKey)return;n.closePopup()}ji(t)}}});Ji.addInitHook("addHandler","keyboard",Pn),Ji.mergeOptions({scrollWheelZoom:!0,wheelDebounceTime:40,wheelPxPerZoomLevel:60});var Ln=oe.extend({addHooks:function(){Ei(this._map._container,"mousewheel",this._onWheelScroll,this),this._delta=0},removeHooks:function(){Bi(this._map._container,"mousewheel",this._onWheelScroll,this)},_onWheelScroll:function(t){var i=Fi(t),e=this._map.options.wheelDebounceTime;this._delta+=i,this._lastMousePos=this._map.mouseEventToContainerPoint(t),this._startTime||(this._startTime=+new Date);var n=Math.max(e-(+new Date-this._startTime),0);clearTimeout(this._timer),this._timer=setTimeout(a(this._performZoom,this),n),ji(t)},_performZoom:function(){var t=this._map,i=t.getZoom(),e=this._map.options.zoomSnap||0;t._stop();var n=this._delta/(4*this._map.options.wheelPxPerZoomLevel),o=4*Math.log(2/(1+Math.exp(-Math.abs(n))))/Math.LN2,s=e?Math.ceil(o/e)*e:o,r=t._limitZoom(i+(0<this._delta?s:-s))-i;this._delta=0,this._startTime=null,r&&("center"===t.options.scrollWheelZoom?t.setZoom(i+r):t.setZoomAround(this._lastMousePos,i+r))}});Ji.addInitHook("addHandler","scrollWheelZoom",Ln),Ji.mergeOptions({tap:!0,tapTolerance:15});var bn=oe.extend({addHooks:function(){Ei(this._map._container,"touchstart",this._onDown,this)},removeHooks:function(){Bi(this._map._container,"touchstart",this._onDown,this)},_onDown:function(t){if(t.touches){if(Di(t),this._fireClick=!0,1<t.touches.length)return this._fireClick=!1,void clearTimeout(this._holdTimeout);var i=t.touches[0],e=i.target;this._startPos=this._newPos=new B(i.clientX,i.clientY),e.tagName&&"a"===e.tagName.toLowerCase()&&pi(e,"leaflet-active"),this._holdTimeout=setTimeout(a(function(){this._isTapValid()&&(this._fireClick=!1,this._onUp(),this._simulateEvent("contextmenu",i))},this),1e3),this._simulateEvent("mousedown",i),Ei(document,{touchmove:this._onMove,touchend:this._onUp},this)}},_onUp:function(t){if(clearTimeout(this._holdTimeout),Bi(document,{touchmove:this._onMove,touchend:this._onUp},this),this._fireClick&&t&&t.changedTouches){var i=t.changedTouches[0],e=i.target;e&&e.tagName&&"a"===e.tagName.toLowerCase()&&mi(e,"leaflet-active"),this._simulateEvent("mouseup",i),this._isTapValid()&&this._simulateEvent("click",i)}},_isTapValid:function(){return this._newPos.distanceTo(this._startPos)<=this._map.options.tapTolerance},_onMove:function(t){var i=t.touches[0];this._newPos=new B(i.clientX,i.clientY),this._simulateEvent("mousemove",i)},_simulateEvent:function(t,i){var e=document.createEvent("MouseEvents");e._simulated=!0,i.target._simulatedClick=!0,e.initMouseEvent(t,!0,!0,window,1,i.screenX,i.screenY,i.clientX,i.clientY,!1,!1,!1,!1,0,null),i.target.dispatchEvent(e)}});Tt&&!bt&&Ji.addInitHook("addHandler","tap",bn),Ji.mergeOptions({touchZoom:Tt&&!rt,bounceAtZoomLimits:!0});var Tn=oe.extend({addHooks:function(){pi(this._map._container,"leaflet-touch-zoom"),Ei(this._map._container,"touchstart",this._onTouchStart,this)},removeHooks:function(){mi(this._map._container,"leaflet-touch-zoom"),Bi(this._map._container,"touchstart",this._onTouchStart,this)},_onTouchStart:function(t){var i=this._map;if(t.touches&&2===t.touches.length&&!i._animatingZoom&&!this._zooming){var e=i.mouseEventToContainerPoint(t.touches[0]),n=i.mouseEventToContainerPoint(t.touches[1]);this._centerPoint=i.getSize()._divideBy(2),this._startLatLng=i.containerPointToLatLng(this._centerPoint),"center"!==i.options.touchZoom&&(this._pinchStartLatLng=i.containerPointToLatLng(e.add(n)._divideBy(2))),this._startDist=e.distanceTo(n),this._startZoom=i.getZoom(),this._moved=!1,this._zooming=!0,i._stop(),Ei(document,"touchmove",this._onTouchMove,this),Ei(document,"touchend",this._onTouchEnd,this),Di(t)}},_onTouchMove:function(t){if(t.touches&&2===t.touches.length&&this._zooming){var i=this._map,e=i.mouseEventToContainerPoint(t.touches[0]),n=i.mouseEventToContainerPoint(t.touches[1]),o=e.distanceTo(n)/this._startDist;if(this._zoom=i.getScaleZoom(o,this._startZoom),!i.options.bounceAtZoomLimits&&(this._zoom<i.getMinZoom()&&o<1||this._zoom>i.getMaxZoom()&&1<o)&&(this._zoom=i._limitZoom(this._zoom)),"center"===i.options.touchZoom){if(this._center=this._startLatLng,1==o)return}else{var s=e._add(n)._divideBy(2)._subtract(this._centerPoint);if(1==o&&0===s.x&&0===s.y)return;this._center=i.unproject(i.project(this._pinchStartLatLng,this._zoom).subtract(s),this._zoom)}this._moved||(i._moveStart(!0,!1),this._moved=!0),C(this._animRequest);var r=a(i._move,i,this._center,this._zoom,{pinch:!0,round:!1});this._animRequest=M(r,this,!0),Di(t)}},_onTouchEnd:function(){this._moved&&this._zooming?(this._zooming=!1,C(this._animRequest),Bi(document,"touchmove",this._onTouchMove),Bi(document,"touchend",this._onTouchEnd),this._map.options.zoomAnimation?this._map._animateZoom(this._center,this._map._limitZoom(this._zoom),!0,this._map.options.zoomSnap):this._map._resetView(this._center,this._map._limitZoom(this._zoom))):this._zooming=!1}});Ji.addInitHook("addHandler","touchZoom",Tn),Ji.BoxZoom=yn,Ji.DoubleClickZoom=xn,Ji.Drag=wn,Ji.Keyboard=Pn,Ji.ScrollWheelZoom=Ln,Ji.Tap=bn,Ji.TouchZoom=Tn,Object.freeze=i,t.version="1.5.1+HEAD.2e3e0ff",t.Control=Qi,t.control=$i,t.Browser=Bt,t.Evented=k,t.Mixin=re,t.Util=S,t.Class=Z,t.Handler=oe,t.extend=h,t.bind=a,t.stamp=u,t.setOptions=p,t.DomEvent=Yi,t.DomUtil=Zi,t.PosAnimation=Xi,t.Draggable=le,t.LineUtil=ye,t.PolyUtil=Pe,t.Point=B,t.point=I,t.Bounds=O,t.bounds=R,t.Transformation=G,t.transformation=K,t.Projection=Te,t.LatLng=j,t.latLng=W,t.LatLngBounds=N,t.latLngBounds=D,t.CRS=F,t.GeoJSON=We,t.geoJSON=Xe,t.geoJson=Je,t.Layer=Se,t.LayerGroup=Ze,t.layerGroup=function(t,i){return new Ze(t,i)},t.FeatureGroup=Ee,t.featureGroup=function(t){return new Ee(t)},t.ImageOverlay=$e,t.imageOverlay=function(t,i,e){return new $e(t,i,e)},t.VideoOverlay=Qe,t.videoOverlay=function(t,i,e){return new Qe(t,i,e)},t.SVGOverlay=tn,t.svgOverlay=function(t,i,e){return new tn(t,i,e)},t.DivOverlay=en,t.Popup=nn,t.popup=function(t,i){return new nn(t,i)},t.Tooltip=on,t.tooltip=function(t,i){return new on(t,i)},t.Icon=ke,t.icon=function(t){return new ke(t)},t.DivIcon=sn,t.divIcon=function(t){return new sn(t)},t.Marker=Ie,t.marker=function(t,i){return new Ie(t,i)},t.TileLayer=an,t.tileLayer=hn,t.GridLayer=rn,t.gridLayer=function(t){return new rn(t)},t.SVG=fn,t.svg=gn,t.Renderer=ln,t.Canvas=cn,t.canvas=_n,t.Path=Oe,t.CircleMarker=Re,t.circleMarker=function(t,i){return new Re(t,i)},t.Circle=Ne,t.circle=function(t,i,e){return new Ne(t,i,e)},t.Polyline=De,t.polyline=function(t,i){return new De(t,i)},t.Polygon=je,t.polygon=function(t,i){return new je(t,i)},t.Rectangle=vn,t.rectangle=function(t,i){return new vn(t,i)},t.Map=Ji,t.map=function(t,i){return new Ji(t,i)};var zn=window.L;t.noConflict=function(){return window.L=zn,this},window.L=t});
!function(t){var e={};function r(n){if(e[n])return e[n].exports;var i=e[n]={i:n,l:!1,exports:{}};return t[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)r.d(n,i,function(e){return t[e]}.bind(null,i));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=55)}([function(t,e,r){var n=r(123);t.exports=function(t,e,r){var i=null==t?void 0:n(t,e);return void 0===i?r:i}},function(t,e,r){"use strict";function n(t,e,r){void 0===r&&(r={});var n={type:"Feature"};return 0!==r.id&&!r.id||(n.id=r.id),r.bbox&&(n.bbox=r.bbox),n.properties=e||{},n.geometry=t,n}function i(t,e,r){return void 0===r&&(r={}),n({type:"Point",coordinates:t},e,r)}function o(t,e,r){void 0===r&&(r={});for(var i=0,o=t;i<o.length;i++){var a=o[i];if(a.length<4)throw new Error("Each LinearRing of a Polygon must have 4 or more Positions.");for(var s=0;s<a[a.length-1].length;s++)if(a[a.length-1][s]!==a[0][s])throw new Error("First and last Position are not equivalent.")}return n({type:"Polygon",coordinates:t},e,r)}function a(t,e,r){if(void 0===r&&(r={}),t.length<2)throw new Error("coordinates must be an array of two or more positions");return n({type:"LineString",coordinates:t},e,r)}function s(t,e){void 0===e&&(e={});var r={type:"FeatureCollection"};return e.id&&(r.id=e.id),e.bbox&&(r.bbox=e.bbox),r.features=t,r}function l(t,e,r){return void 0===r&&(r={}),n({type:"MultiLineString",coordinates:t},e,r)}function h(t,e,r){return void 0===r&&(r={}),n({type:"MultiPoint",coordinates:t},e,r)}function c(t,e,r){return void 0===r&&(r={}),n({type:"MultiPolygon",coordinates:t},e,r)}function u(t,r){void 0===r&&(r="kilometers");var n=e.factors[r];if(!n)throw new Error(r+" units is invalid");return t*n}function p(t,r){void 0===r&&(r="kilometers");var n=e.factors[r];if(!n)throw new Error(r+" units is invalid");return t/n}function f(t){return t%(2*Math.PI)*180/Math.PI}function d(t){return!isNaN(t)&&null!==t&&!Array.isArray(t)&&!/^\s*$/.test(t)}Object.defineProperty(e,"__esModule",{value:!0}),e.earthRadius=6371008.8,e.factors={centimeters:100*e.earthRadius,centimetres:100*e.earthRadius,degrees:e.earthRadius/111325,feet:3.28084*e.earthRadius,inches:39.37*e.earthRadius,kilometers:e.earthRadius/1e3,kilometres:e.earthRadius/1e3,meters:e.earthRadius,metres:e.earthRadius,miles:e.earthRadius/1609.344,millimeters:1e3*e.earthRadius,millimetres:1e3*e.earthRadius,nauticalmiles:e.earthRadius/1852,radians:1,yards:e.earthRadius/1.0936},e.unitsFactors={centimeters:100,centimetres:100,degrees:1/111325,feet:3.28084,inches:39.37,kilometers:.001,kilometres:.001,meters:1,metres:1,miles:1/1609.344,millimeters:1e3,millimetres:1e3,nauticalmiles:1/1852,radians:1/e.earthRadius,yards:1/1.0936},e.areaFactors={acres:247105e-9,centimeters:1e4,centimetres:1e4,feet:10.763910417,inches:1550.003100006,kilometers:1e-6,kilometres:1e-6,meters:1,metres:1,miles:386e-9,millimeters:1e6,millimetres:1e6,yards:1.195990046},e.feature=n,e.geometry=function(t,e,r){switch(void 0===r&&(r={}),t){case"Point":return i(e).geometry;case"LineString":return a(e).geometry;case"Polygon":return o(e).geometry;case"MultiPoint":return h(e).geometry;case"MultiLineString":return l(e).geometry;case"MultiPolygon":return c(e).geometry;default:throw new Error(t+" is invalid")}},e.point=i,e.points=function(t,e,r){return void 0===r&&(r={}),s(t.map((function(t){return i(t,e)})),r)},e.polygon=o,e.polygons=function(t,e,r){return void 0===r&&(r={}),s(t.map((function(t){return o(t,e)})),r)},e.lineString=a,e.lineStrings=function(t,e,r){return void 0===r&&(r={}),s(t.map((function(t){return a(t,e)})),r)},e.featureCollection=s,e.multiLineString=l,e.multiPoint=h,e.multiPolygon=c,e.geometryCollection=function(t,e,r){return void 0===r&&(r={}),n({type:"GeometryCollection",geometries:t},e,r)},e.round=function(t,e){if(void 0===e&&(e=0),e&&!(0<=e))throw new Error("precision must be a positive number");var r=Math.pow(10,e||0);return Math.round(t*r)/r},e.radiansToLength=u,e.lengthToRadians=p,e.lengthToDegrees=function(t,e){return f(p(t,e))},e.bearingToAzimuth=function(t){var e=t%360;return e<0&&(e+=360),e},e.radiansToDegrees=f,e.degreesToRadians=function(t){return t%360*Math.PI/180},e.convertLength=function(t,e,r){if(void 0===e&&(e="kilometers"),void 0===r&&(r="kilometers"),!(0<=t))throw new Error("length must be a positive number");return u(p(t,e),r)},e.convertArea=function(t,r,n){if(void 0===r&&(r="meters"),void 0===n&&(n="kilometers"),!(0<=t))throw new Error("area must be a positive number");var i=e.areaFactors[r];if(!i)throw new Error("invalid original units");var o=e.areaFactors[n];if(!o)throw new Error("invalid final units");return t/i*o},e.isNumber=d,e.isObject=function(t){return!!t&&t.constructor===Object},e.validateBBox=function(t){if(!t)throw new Error("bbox is required");if(!Array.isArray(t))throw new Error("bbox must be an Array");if(4!==t.length&&6!==t.length)throw new Error("bbox must be an Array of 4 or 6 numbers");t.forEach((function(t){if(!d(t))throw new Error("bbox must only contain numbers")}))},e.validateId=function(t){if(!t)throw new Error("id is required");if(-1===["string","number"].indexOf(typeof t))throw new Error("id must be a number or a string")},e.radians2degrees=function(){throw new Error("method has been renamed to `radiansToDegrees`")},e.degrees2radians=function(){throw new Error("method has been renamed to `degreesToRadians`")},e.distanceToDegrees=function(){throw new Error("method has been renamed to `lengthToDegrees`")},e.distanceToRadians=function(){throw new Error("method has been renamed to `lengthToRadians`")},e.radiansToDistance=function(){throw new Error("method has been renamed to `radiansToLength`")},e.bearingToAngle=function(){throw new Error("method has been renamed to `bearingToAzimuth`")},e.convertDistance=function(){throw new Error("method has been renamed to `convertLength`")}},function(t,e){t.exports=function(t){var e=typeof t;return null!=t&&("object"==e||"function"==e)}},function(t,e,r){var n=r(28),i="object"==typeof self&&self&&self.Object===Object&&self,o=n||i||Function("return this")();t.exports=o},function(t,e){t.exports=function(t){return null!=t&&"object"==typeof t}},function(t,e){var r=Array.isArray;t.exports=r},function(t,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n=r(1);function i(t,e,r,n,i,o,a,s){var l,h,c,u,p={x:null,y:null,onLine1:!1,onLine2:!1};return 0==(l=(s-o)*(r-t)-(a-i)*(n-e))?null!==p.x&&null!==p.y&&p:(u=(r-t)*(h=e-o)-(n-e)*(c=t-i),h=((a-i)*h-(s-o)*c)/l,c=u/l,p.x=t+h*(r-t),p.y=e+h*(n-e),0<=h&&h<=1&&(p.onLine1=!0),0<=c&&c<=1&&(p.onLine2=!0),!(!p.onLine1||!p.onLine2)&&[p.x,p.y])}e.default=function(t){var e,r,o={type:"FeatureCollection",features:[]};if("LineString"===(r="Feature"===t.type?t.geometry:t).type)e=[r.coordinates];else if("MultiLineString"===r.type)e=r.coordinates;else if("MultiPolygon"===r.type)e=[].concat.apply([],r.coordinates);else{if("Polygon"!==r.type)throw new Error("Input must be a LineString, MultiLineString, Polygon, or MultiPolygon Feature or Geometry");e=r.coordinates}return e.forEach((function(t){e.forEach((function(e){for(var r=0;r<t.length-1;r++)for(var a=r;a<e.length-1;a++){if(t===e){if(1===Math.abs(r-a))continue;if(0===r&&a===t.length-2&&t[r][0]===t[t.length-1][0]&&t[r][1]===t[t.length-1][1])continue}var s=i(t[r][0],t[r][1],t[r+1][0],t[r+1][1],e[a][0],e[a][1],e[a+1][0],e[a+1][1]);s&&o.features.push(n.point([s[0],s[1]]))}}))})),o}},function(t,e,r){var n=r(16),i=r(71),o=r(72),a=n?n.toStringTag:void 0;t.exports=function(t){return null==t?void 0===t?"[object Undefined]":"[object Null]":a&&a in Object(t)?i(t):o(t)}},function(t,e,r){var n=r(59),i=r(60),o=r(61),a=r(62),s=r(63);function l(t){var e=-1,r=null==t?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}l.prototype.clear=n,l.prototype.delete=i,l.prototype.get=o,l.prototype.has=a,l.prototype.set=s,t.exports=l},function(t,e,r){var n=r(10);t.exports=function(t,e){for(var r=t.length;r--;)if(n(t[r][0],e))return r;return-1}},function(t,e){t.exports=function(t,e){return t===e||t!=t&&e!=e}},function(t,e,r){var n=r(14)(Object,"create");t.exports=n},function(t,e,r){var n=r(85);t.exports=function(t,e){var r=t.__data__;return n(e)?r["string"==typeof e?"string":"hash"]:r.map}},function(t,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n=r(1);e.getCoord=function(t){if(!t)throw new Error("coord is required");if(!Array.isArray(t)){if("Feature"===t.type&&null!==t.geometry&&"Point"===t.geometry.type)return t.geometry.coordinates;if("Point"===t.type)return t.coordinates}if(Array.isArray(t)&&2<=t.length&&!Array.isArray(t[0])&&!Array.isArray(t[1]))return t;throw new Error("coord must be GeoJSON Point or an Array of numbers")},e.getCoords=function(t){if(Array.isArray(t))return t;if("Feature"===t.type){if(null!==t.geometry)return t.geometry.coordinates}else if(t.coordinates)return t.coordinates;throw new Error("coords must be GeoJSON Feature, Geometry Object or an Array")},e.containsNumber=function t(e){if(1<e.length&&n.isNumber(e[0])&&n.isNumber(e[1]))return!0;if(Array.isArray(e[0])&&e[0].length)return t(e[0]);throw new Error("coordinates must only contain numbers")},e.geojsonType=function(t,e,r){if(!e||!r)throw new Error("type and name required");if(!t||t.type!==e)throw new Error("Invalid input to "+r+": must be a "+e+", given "+t.type)},e.featureOf=function(t,e,r){if(!t)throw new Error("No feature passed");if(!r)throw new Error(".featureOf() requires a name");if(!t||"Feature"!==t.type||!t.geometry)throw new Error("Invalid input to "+r+", Feature with geometry required");if(!t.geometry||t.geometry.type!==e)throw new Error("Invalid input to "+r+": must be a "+e+", given "+t.geometry.type)},e.collectionOf=function(t,e,r){if(!t)throw new Error("No featureCollection passed");if(!r)throw new Error(".collectionOf() requires a name");if(!t||"FeatureCollection"!==t.type)throw new Error("Invalid input to "+r+", FeatureCollection required");for(var n=0,i=t.features;n<i.length;n++){var o=i[n];if(!o||"Feature"!==o.type||!o.geometry)throw new Error("Invalid input to "+r+", Feature with geometry required");if(!o.geometry||o.geometry.type!==e)throw new Error("Invalid input to "+r+": must be a "+e+", given "+o.geometry.type)}},e.getGeom=function(t){return"Feature"===t.type?t.geometry:t},e.getType=function(t,e){return"FeatureCollection"===t.type?"FeatureCollection":"GeometryCollection"===t.type?"GeometryCollection":"Feature"===t.type&&null!==t.geometry?t.geometry.type:t.type}},function(t,e,r){var n=r(69),i=r(76);t.exports=function(t,e){var r=i(t,e);return n(r)?r:void 0}},function(t,e,r){var n=r(7),i=r(2);t.exports=function(t){if(!i(t))return!1;var e=n(t);return"[object Function]"==e||"[object GeneratorFunction]"==e||"[object AsyncFunction]"==e||"[object Proxy]"==e}},function(t,e,r){var n=r(3).Symbol;t.exports=n},function(t,e,r){var n=r(31);t.exports=function(t,e,r){"__proto__"==e&&n?n(t,e,{configurable:!0,enumerable:!0,value:r,writable:!0}):t[e]=r}},function(t,e){t.exports=function(t){return t.webpackPolyfill||(t.deprecate=function(){},t.paths=[],t.children||(t.children=[]),Object.defineProperty(t,"loaded",{enumerable:!0,get:function(){return t.l}}),Object.defineProperty(t,"id",{enumerable:!0,get:function(){return t.i}}),t.webpackPolyfill=1),t}},function(t,e,r){var n=r(100),i=r(4),o=Object.prototype,a=o.hasOwnProperty,s=o.propertyIsEnumerable,l=n(function(){return arguments}())?n:function(t){return i(t)&&a.call(t,"callee")&&!s.call(t,"callee")};t.exports=l},function(t,e,r){var n=r(15),i=r(21);t.exports=function(t){return null!=t&&i(t.length)&&!n(t)}},function(t,e){t.exports=function(t){return"number"==typeof t&&-1<t&&t%1==0&&t<=9007199254740991}},function(t,e){var r=/^(?:0|[1-9]\d*)$/;t.exports=function(t,e){var n=typeof t;return!!(e=null==e?9007199254740991:e)&&("number"==n||"symbol"!=n&&r.test(t))&&-1<t&&t%1==0&&t<e}},function(t,e,r){var n=r(7),i=r(4);t.exports=function(t){return"symbol"==typeof t||i(t)&&"[object Symbol]"==n(t)}},function(t,e,r){!function(t){"use strict";function e(t,e){return e<t?1:t<e?-1:0}var r=function(t,r){void 0===t&&(t=e),void 0===r&&(r=!1),this._compare=t,this._root=null,this._size=0,this._noDuplicates=!!r},n={size:{configurable:!0}};r.prototype.rotateLeft=function(t){var e=t.right;e&&(t.right=e.left,e.left&&(e.left.parent=t),e.parent=t.parent),t.parent?t===t.parent.left?t.parent.left=e:t.parent.right=e:this._root=e,e&&(e.left=t),t.parent=e},r.prototype.rotateRight=function(t){var e=t.left;e&&(t.left=e.right,e.right&&(e.right.parent=t),e.parent=t.parent),t.parent?t===t.parent.left?t.parent.left=e:t.parent.right=e:this._root=e,e&&(e.right=t),t.parent=e},r.prototype._splay=function(t){for(var e=this;t.parent;){var r=t.parent;r.parent?r.left===t&&r.parent.left===r?(e.rotateRight(r.parent),e.rotateRight(r)):r.right===t&&r.parent.right===r?(e.rotateLeft(r.parent),e.rotateLeft(r)):r.left===t&&r.parent.right===r?(e.rotateRight(r),e.rotateLeft(r)):(e.rotateLeft(r),e.rotateRight(r)):r.left===t?e.rotateRight(r):e.rotateLeft(r)}},r.prototype.splay=function(t){for(var e,r,n,i,o;t.parent;)(r=(e=t.parent).parent)&&r.parent?((n=r.parent).left===r?n.left=t:n.right=t,t.parent=n):(t.parent=null,this._root=t),i=t.left,o=t.right,t===e.left?(r&&(r.left===e?(e.right?(r.left=e.right,r.left.parent=r):r.left=null,(e.right=r).parent=e):(i?(r.right=i).parent=r:r.right=null,(t.left=r).parent=t)),o?(e.left=o).parent=e:e.left=null,(t.right=e).parent=t):(r&&(r.right===e?(e.left?(r.right=e.left,r.right.parent=r):r.right=null,(e.left=r).parent=e):(o?(r.left=o).parent=r:r.left=null,(t.right=r).parent=t)),i?(e.right=i).parent=e:e.right=null,(t.left=e).parent=t)},r.prototype.replace=function(t,e){t.parent?t===t.parent.left?t.parent.left=e:t.parent.right=e:this._root=e,e&&(e.parent=t.parent)},r.prototype.minNode=function(t){if(void 0===t&&(t=this._root),t)for(;t.left;)t=t.left;return t},r.prototype.maxNode=function(t){if(void 0===t&&(t=this._root),t)for(;t.right;)t=t.right;return t},r.prototype.insert=function(t,e){var r=this._root,n=null,i=this._compare;if(this._noDuplicates)for(;r;){if(0===i((n=r).key,t))return;r=i(r.key,t)<0?r.right:r.left}else for(;r;)r=i((n=r).key,t)<0?r.right:r.left;return r={key:t,data:e,left:null,right:null,parent:n},n?i(n.key,r.key)<0?n.right=r:n.left=r:this._root=r,this.splay(r),this._size++,r},r.prototype.find=function(t){for(var e=this._root,r=this._compare;e;){var n=r(e.key,t);if(n<0)e=e.right;else{if(!(0<n))return e;e=e.left}}return null},r.prototype.contains=function(t){for(var e=this._root,r=this._compare;e;){var n=r(t,e.key);if(0===n)return!0;e=n<0?e.left:e.right}return!1},r.prototype.remove=function(t){var e=this.find(t);if(!e)return!1;if(this.splay(e),e.left)if(e.right){var r=this.minNode(e.right);r.parent!==e&&(this.replace(r,r.right),r.right=e.right,r.right.parent=r),this.replace(e,r),r.left=e.left,r.left.parent=r}else this.replace(e,e.left);else this.replace(e,e.right);return this._size--,!0},r.prototype.removeNode=function(t){if(!t)return!1;if(this.splay(t),t.left)if(t.right){var e=this.minNode(t.right);e.parent!==t&&(this.replace(e,e.right),e.right=t.right,e.right.parent=e),this.replace(t,e),e.left=t.left,e.left.parent=e}else this.replace(t,t.left);else this.replace(t,t.right);return this._size--,!0},r.prototype.erase=function(t){var e=this.find(t);if(e){this.splay(e);var r=e.left,n=e.right,i=null;r&&(r.parent=null,i=this.maxNode(r),this.splay(i),this._root=i),n&&(r?i.right=n:this._root=n,n.parent=i),this._size--}},r.prototype.pop=function(){var t=this._root,e=null;if(t){for(;t.left;)t=t.left;e={key:t.key,data:t.data},this.remove(t.key)}return e},r.prototype.next=function(t){var e=t;if(e)if(e.right)for(e=e.right;e&&e.left;)e=e.left;else for(e=t.parent;e&&e.right===t;)e=(t=e).parent;return e},r.prototype.prev=function(t){var e=t;if(e)if(e.left)for(e=e.left;e&&e.right;)e=e.right;else for(e=t.parent;e&&e.left===t;)e=(t=e).parent;return e},r.prototype.forEach=function(t){for(var e=this._root,r=[],n=!1,i=0;!n;)e?(r.push(e),e=e.left):0<r.length?(t(e=r.pop(),i++),e=e.right):n=!0;return this},r.prototype.range=function(t,e,r,n){for(var i=[],o=this._compare,a=this._root;0!==i.length||a;)if(a)i.push(a),a=a.left;else{if(0<o((a=i.pop()).key,e))break;if(0<=o(a.key,t)&&r.call(n,a))return this;a=a.right}return this},r.prototype.keys=function(){for(var t=this._root,e=[],r=[],n=!1;!n;)t?(e.push(t),t=t.left):0<e.length?(t=e.pop(),r.push(t.key),t=t.right):n=!0;return r},r.prototype.values=function(){for(var t=this._root,e=[],r=[],n=!1;!n;)t?(e.push(t),t=t.left):0<e.length?(t=e.pop(),r.push(t.data),t=t.right):n=!0;return r},r.prototype.at=function(t){for(var e=this._root,r=[],n=!1,i=0;!n;)if(e)r.push(e),e=e.left;else if(0<r.length){if(e=r.pop(),i===t)return e;i++,e=e.right}else n=!0;return null},r.prototype.load=function(t,e,r){if(void 0===t&&(t=[]),void 0===e&&(e=[]),void 0===r&&(r=!1),0!==this._size)throw new Error("bulk-load: tree is not empty");var n=t.length;return r&&function t(e,r,n,i,o){if(!(i<=n)){for(var a=e[n+i>>1],s=n-1,l=i+1;;){for(;o(e[++s],a)<0;);for(;0<o(e[--l],a););if(l<=s)break;var h=e[s];e[s]=e[l],e[l]=h,h=r[s],r[s]=r[l],r[l]=h}t(e,r,n,l,o),t(e,r,l+1,i,o)}}(t,e,0,n-1,this._compare),this._root=function t(e,r,n,i,o){var a=o-i;if(0<a){var s=i+Math.floor(a/2),l={key:r[s],data:n[s],parent:e};return l.left=t(l,r,n,i,s),l.right=t(l,r,n,s+1,o),l}return null}(null,t,e,0,n),this._size=n,this},r.prototype.min=function(){var t=this.minNode(this._root);return t?t.key:null},r.prototype.max=function(){var t=this.maxNode(this._root);return t?t.key:null},r.prototype.isEmpty=function(){return null===this._root},n.size.get=function(){return this._size},r.createTree=function(t,e,n,i,o){return new r(n,o).load(t,e,i)},Object.defineProperties(r.prototype,n);var i=0,o=1,a=2,s=3,l=0,h=1,c=2,u=3;function p(t,e,r){null===e?(t.inOut=!1,t.otherInOut=!0):(t.isSubject===e.isSubject?(t.inOut=!e.inOut,t.otherInOut=e.otherInOut):(t.inOut=!e.otherInOut,t.otherInOut=e.isVertical()?!e.inOut:e.inOut),e&&(t.prevInResult=!f(e,r)||e.isVertical()?e.prevInResult:e)),t.inResult=f(t,r)}function f(t,e){switch(t.type){case i:switch(e){case l:return!t.otherInOut;case h:return t.otherInOut;case c:return t.isSubject&&t.otherInOut||!t.isSubject&&!t.otherInOut;case u:return!0}break;case a:return e===l||e===h;case s:return e===c;case o:return!1}return!1}var d=function(t,e,r,n,o){this.left=e,this.point=t,this.otherEvent=r,this.isSubject=n,this.type=o||i,this.inOut=!1,this.otherInOut=!1,this.prevInResult=null,this.inResult=!1,this.resultInOut=!1,this.isExteriorRing=!0};function g(t,e){return t[0]===e[0]&&t[1]===e[1]}function _(t,e,r){return(t[0]-r[0])*(e[1]-r[1])-(e[0]-r[0])*(t[1]-r[1])}function m(t,e){var r=t.point,n=e.point;return r[0]>n[0]?1:r[0]<n[0]?-1:r[1]!==n[1]?r[1]>n[1]?1:-1:function(t,e,r,n){return t.left===e.left?0===_(r,t.otherEvent.point,e.otherEvent.point)?!t.isSubject&&e.isSubject?1:-1:t.isBelow(e.otherEvent.point)?-1:1:t.left?1:-1}(t,e,r)}function y(t,e,r){var n=new d(e,!1,t,t.isSubject),i=new d(e,!0,t.otherEvent,t.isSubject);return g(t.point,t.otherEvent.point)&&console.warn("what is that, a collapsed segment?",t),n.contourId=i.contourId=t.contourId,0<m(i,t.otherEvent)&&(t.otherEvent.left=!0,i.left=!1),t.otherEvent.otherEvent=i,t.otherEvent=n,r.push(i),r.push(n),r}function v(t,e){return t[0]*e[1]-t[1]*e[0]}function L(t,e){return t[0]*e[0]+t[1]*e[1]}function b(t,e,r){var n=function(t,e,r,n,i){var o=[e[0]-t[0],e[1]-t[1]],a=[n[0]-r[0],n[1]-r[1]];function s(t,e,r){return[t[0]+e*r[0],t[1]+e*r[1]]}var l=[r[0]-t[0],r[1]-t[1]],h=v(o,a),c=h*h,u=L(o,o);if(0<c){var p=v(l,a)/h;if(p<0||1<p)return null;var f=v(l,o)/h;return f<0||1<f?null:0==p||1==p?i?null:[s(t,p,o)]:0==f||1==f?i?null:[s(r,f,a)]:[s(t,p,o)]}if(0<(c=(h=v(l,o))*h))return null;var d=L(o,l)/u,g=d+L(o,a)/u,_=Math.min(d,g),m=Math.max(d,g);return _<=1&&0<=m?1===_?i?null:[s(t,0<_?_:0,o)]:0===m?i?null:[s(t,m<1?m:1,o)]:i&&0===_&&1===m?null:[s(t,0<_?_:0,o),s(t,m<1?m:1,o)]:null}(t.point,t.otherEvent.point,e.point,e.otherEvent.point),i=n?n.length:0;if(0===i)return 0;if(1===i&&(g(t.point,e.point)||g(t.otherEvent.point,e.otherEvent.point)))return 0;if(2===i&&t.isSubject===e.isSubject)return 0;if(1===i)return g(t.point,n[0])||g(t.otherEvent.point,n[0])||y(t,n[0],r),g(e.point,n[0])||g(e.otherEvent.point,n[0])||y(e,n[0],r),1;var l=[],h=!1,c=!1;return g(t.point,e.point)?h=!0:1===m(t,e)?l.push(e,t):l.push(t,e),g(t.otherEvent.point,e.otherEvent.point)?c=!0:1===m(t.otherEvent,e.otherEvent)?l.push(e.otherEvent,t.otherEvent):l.push(t.otherEvent,e.otherEvent),h&&c||h?(e.type=o,t.type=e.inOut===t.inOut?a:s,h&&!c&&y(l[1].otherEvent,l[0].point,r),2):(c?y(l[0],l[1].point,r):l[0]!==l[3].otherEvent?(y(l[0],l[1].point,r),y(l[1],l[2].point,r)):(y(l[0],l[1].point,r),y(l[3].otherEvent,l[2].point,r)),3)}function k(t,e){if(t===e)return 0;if(0!==_(t.point,t.otherEvent.point,e.point)||0!==_(t.point,t.otherEvent.point,e.otherEvent.point))return g(t.point,e.point)?t.isBelow(e.otherEvent.point)?-1:1:t.point[0]===e.point[0]?t.point[1]<e.point[1]?-1:1:1===m(t,e)?e.isAbove(t.point)?-1:1:t.isBelow(e.point)?-1:1;if(t.isSubject!==e.isSubject)return t.isSubject?-1:1;var r=t.point,n=e.point;return r[0]===n[0]&&r[1]===n[1]?(r=t.otherEvent.point,n=e.otherEvent.point,r[0]===n[0]&&r[1]===n[1]?0:t.contourId>e.contourId?1:-1):1===m(t,e)?1:-1}function M(t,e,r,n){var i=t+1,o=e.length;if(o-1<i)return t-1;for(var a=e[t].point,s=e[i].point;i<o&&s[0]===a[0]&&s[1]===a[1];){if(!r[i])return i;s=e[++i].point}for(i=t-1;r[i]&&n<=i;)i--;return i}d.prototype.isBelow=function(t){var e=this.point,r=this.otherEvent.point;return this.left?0<(e[0]-t[0])*(r[1]-t[1])-(r[0]-t[0])*(e[1]-t[1]):0<(r[0]-t[0])*(e[1]-t[1])-(e[0]-t[0])*(r[1]-t[1])},d.prototype.isAbove=function(t){return!this.isBelow(t)},d.prototype.isVertical=function(){return this.point[0]===this.otherEvent.point[0]},d.prototype.clone=function(){var t=new d(this.point,this.left,this.otherEvent,this.isSubject,this.type);return t.inResult=this.inResult,t.prevInResult=this.prevInResult,t.isExteriorRing=this.isExteriorRing,t.inOut=this.inOut,t.otherInOut=this.otherInOut,t};var w=x,C=x;function x(t,e){if(!(this instanceof x))return new x(t,e);if(this.data=t||[],this.length=this.data.length,this.compare=e||S,0<this.length)for(var r=(this.length>>1)-1;0<=r;r--)this._down(r)}function S(t,e){return t<e?-1:e<t?1:0}x.prototype={push:function(t){this.data.push(t),this.length++,this._up(this.length-1)},pop:function(){if(0!==this.length){var t=this.data[0];return this.length--,0<this.length&&(this.data[0]=this.data[this.length],this._down(0)),this.data.pop(),t}},peek:function(){return this.data[0]},_up:function(t){for(var e=this.data,r=this.compare,n=e[t];0<t;){var i=t-1>>1,o=e[i];if(0<=r(n,o))break;e[t]=o,t=i}e[t]=n},_down:function(t){for(var e=this.data,r=this.compare,n=this.length>>1,i=e[t];t<n;){var o=1+(t<<1),a=o+1,s=e[o];if(a<this.length&&r(e[a],s)<0&&(s=e[o=a]),0<=r(s,i))break;e[t]=s,t=o}e[t]=i}},w.default=C;var E=Math.max,P=Math.min,O=0;function B(t,e,r,n,i,o){var a,s,l,h,c,u;for(a=0,s=t.length-1;a<s;a++)if(l=t[a],h=t[a+1],c=new d(l,!1,void 0,e),u=new d(h,!1,c,e),c.otherEvent=u,l[0]!==h[0]||l[1]!==h[1]){c.contourId=u.contourId=r,o||(c.isExteriorRing=!1,u.isExteriorRing=!1),0<m(c,u)?u.left=!0:c.left=!0;var p=l[0],f=l[1];i[0]=P(i[0],p),i[1]=P(i[1],f),i[2]=E(i[2],p),i[3]=E(i[3],f),n.push(c),n.push(u)}}var T=[];function D(t,e,n){"number"==typeof t[0][0][0]&&(t=[t]),"number"==typeof e[0][0][0]&&(e=[e]);var i=function(t,e,r){var n=null;return t.length*e.length==0&&(r===l?n=T:r===c?n=t:r!==h&&r!==u||(n=0===t.length?e:t)),n}(t,e,n);if(i)return i===T?null:i;var o=[1/0,1/0,-1/0,-1/0],a=[1/0,1/0,-1/0,-1/0],s=function(t,e,r,n,i){var o,a,s,l,h,u,p=new w(null,m);for(s=0,l=t.length;s<l;s++)for(h=0,u=(o=t[s]).length;h<u;h++)(a=0===h)&&O++,B(o[h],!0,O,p,r,a);for(s=0,l=e.length;s<l;s++)for(h=0,u=(o=e[s]).length;h<u;h++)a=0===h,i===c&&(a=!1),a&&O++,B(o[h],!1,O,p,n,a);return p}(t,e,o,a,n);return(i=function(t,e,r,n,i){var o=null;return(r[0]>n[2]||n[0]>r[2]||r[1]>n[3]||n[1]>r[3])&&(i===l?o=T:i===c?o=t:i!==h&&i!==u||(o=t.concat(e))),o}(t,e,o,a,n))?i===T?null:i:function(t,e){var r,n,i,o=function(t){var e,r,n,i,o=[];for(r=0,n=t.length;r<n;r++)((e=t[r]).left&&e.inResult||!e.left&&e.otherEvent.inResult)&&o.push(e);for(var a=!1;!a;)for(a=!0,r=0,n=o.length;r<n;r++)r+1<n&&1===m(o[r],o[r+1])&&(i=o[r],o[r]=o[r+1],o[r+1]=i,a=!1);for(r=0,n=o.length;r<n;r++)(e=o[r]).pos=r;for(r=0,n=o.length;r<n;r++)(e=o[r]).left||(i=e.pos,e.pos=e.otherEvent.pos,e.otherEvent.pos=i);return o}(t),a={},s=[];for(r=0,n=o.length;r<n;r++)if(!a[r]){var l=[[]];o[r].isExteriorRing?e===c&&!o[r].isSubject&&1<s.length?s[s.length-1].push(l[0]):s.push(l):e!==c||o[r].isSubject||0!==s.length?0===s.length?s.push([[l]]):s[s.length-1].push(l[0]):s.push(l);var h=s.length-1,u=r,p=o[r].point;for(l[0].push(p);r<=u;)i=o[u],a[u]=!0,i.left?(i.resultInOut=!1,i.contourId=h):(i.otherEvent.resultInOut=!0,i.otherEvent.contourId=h),a[u=i.pos]=!0,l[0].push(o[u].point),u=M(u,o,a,r);i=o[u=-1===u?r:u],a[u]=a[i.pos]=!0,i.otherEvent.resultInOut=!0,i.otherEvent.contourId=h}return s}(function(t,e,n,i,o,a){for(var s,h,u,f=new r(k),d=[],g=Math.min(i[2],o[2]);0!==t.length;){var _=t.pop();if(d.push(_),a===l&&_.point[0]>g||a===c&&_.point[0]>i[2])break;if(_.left){h=s=f.insert(_),s=s!==(u=f.minNode())?f.prev(s):null,h=f.next(h);var m=s?s.key:null;if(p(_,m,a),h&&2===b(_,h.key,t)&&(p(_,m,a),p(_,h.key,a)),s&&2===b(s.key,_,t)){var y=s;p(m,(y=y!==u?f.prev(y):null)?y.key:null,a),p(_,m,a)}}else _=_.otherEvent,h=s=f.find(_),s&&h&&(s=s!==u?f.prev(s):null,h=f.next(h),f.remove(_),h&&s&&b(s.key,h.key,t))}return d}(s,0,0,o,a,n),n)}var j={UNION:h,DIFFERENCE:c,INTERSECTION:l,XOR:u};t.union=function(t,e){return D(t,e,h)},t.diff=function(t,e){return D(t,e,c)},t.xor=function(t,e){return D(t,e,u)},t.intersection=function(t,e){return D(t,e,l)},t.operations=j,Object.defineProperty(t,"__esModule",{value:!0})}(e)},function(t,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n=r(1);function i(t,e,r){if(null!==t)for(var n,o,a,s,l,h,c,u,p=0,f=0,d=t.type,g="FeatureCollection"===d,_="Feature"===d,m=g?t.features.length:1,y=0;y<m;y++){l=(u=!!(c=g?t.features[y].geometry:_?t.geometry:t)&&"GeometryCollection"===c.type)?c.geometries.length:1;for(var v=0;v<l;v++){var L=0,b=0;if(null!==(s=u?c.geometries[v]:c)){h=s.coordinates;var k=s.type;switch(p=!r||"Polygon"!==k&&"MultiPolygon"!==k?0:1,k){case null:break;case"Point":if(!1===e(h,f,y,L,b))return!1;f++,L++;break;case"LineString":case"MultiPoint":for(n=0;n<h.length;n++){if(!1===e(h[n],f,y,L,b))return!1;f++,"MultiPoint"===k&&L++}"LineString"===k&&L++;break;case"Polygon":case"MultiLineString":for(n=0;n<h.length;n++){for(o=0;o<h[n].length-p;o++){if(!1===e(h[n][o],f,y,L,b))return!1;f++}"MultiLineString"===k&&L++,"Polygon"===k&&b++}"Polygon"===k&&L++;break;case"MultiPolygon":for(n=0;n<h.length;n++){for(o=b=0;o<h[n].length;o++){for(a=0;a<h[n][o].length-p;a++){if(!1===e(h[n][o][a],f,y,L,b))return!1;f++}b++}L++}break;case"GeometryCollection":for(n=0;n<s.geometries.length;n++)if(!1===i(s.geometries[n],e,r))return!1;break;default:throw new Error("Unknown Geometry Type")}}}}}function o(t,e){var r;switch(t.type){case"FeatureCollection":for(r=0;r<t.features.length&&!1!==e(t.features[r].properties,r);r++);break;case"Feature":e(t.properties,0)}}function a(t,e){if("Feature"===t.type)e(t,0);else if("FeatureCollection"===t.type)for(var r=0;r<t.features.length&&!1!==e(t.features[r],r);r++);}function s(t,e){var r,n,i,o,a,s,l,h,c,u,p=0,f="FeatureCollection"===t.type,d="Feature"===t.type,g=f?t.features.length:1;for(r=0;r<g;r++){for(s=f?t.features[r].geometry:d?t.geometry:t,h=f?t.features[r].properties:d?t.properties:{},c=f?t.features[r].bbox:d?t.bbox:void 0,u=f?t.features[r].id:d?t.id:void 0,a=(l=!!s&&"GeometryCollection"===s.type)?s.geometries.length:1,i=0;i<a;i++)if(null!==(o=l?s.geometries[i]:s))switch(o.type){case"Point":case"LineString":case"MultiPoint":case"Polygon":case"MultiLineString":case"MultiPolygon":if(!1===e(o,p,h,c,u))return!1;break;case"GeometryCollection":for(n=0;n<o.geometries.length;n++)if(!1===e(o.geometries[n],p,h,c,u))return!1;break;default:throw new Error("Unknown Geometry Type")}else if(!1===e(null,p,h,c,u))return!1;p++}}function l(t,e){s(t,(function(t,r,i,o,a){var s,l=null===t?null:t.type;switch(l){case null:case"Point":case"LineString":case"Polygon":return!1!==e(n.feature(t,i,{bbox:o,id:a}),r,0)&&void 0}switch(l){case"MultiPoint":s="Point";break;case"MultiLineString":s="LineString";break;case"MultiPolygon":s="Polygon"}for(var h=0;h<t.coordinates.length;h++){var c={type:s,coordinates:t.coordinates[h]};if(!1===e(n.feature(c,i),r,h))return!1}}))}function h(t,e){l(t,(function(t,r,o){var a=0;if(t.geometry){var s=t.geometry.type;if("Point"!==s&&"MultiPoint"!==s){var l,h=0,c=0,u=0;return!1!==i(t,(function(i,s,p,f,d){if(void 0===l||h<r||c<f||u<d)return l=i,h=r,c=f,u=d,void(a=0);var g=n.lineString([l,i],t.properties);if(!1===e(g,r,o,d,a))return!1;a++,l=i}))&&void 0}}}))}function c(t,e){if(!t)throw new Error("geojson is required");l(t,(function(t,r,i){if(null!==t.geometry){var o=t.geometry.type,a=t.geometry.coordinates;switch(o){case"LineString":if(!1===e(t,r,i,0,0))return!1;break;case"Polygon":for(var s=0;s<a.length;s++)if(!1===e(n.lineString(a[s],t.properties),r,i,s))return!1}}}))}e.coordEach=i,e.coordReduce=function(t,e,r,n){var o=r;return i(t,(function(t,n,i,a,s){o=0===n&&void 0===r?t:e(o,t,n,i,a,s)}),n),o},e.propEach=o,e.propReduce=function(t,e,r){var n=r;return o(t,(function(t,i){n=0===i&&void 0===r?t:e(n,t,i)})),n},e.featureEach=a,e.featureReduce=function(t,e,r){var n=r;return a(t,(function(t,i){n=0===i&&void 0===r?t:e(n,t,i)})),n},e.coordAll=function(t){var e=[];return i(t,(function(t){e.push(t)})),e},e.geomEach=s,e.geomReduce=function(t,e,r){var n=r;return s(t,(function(t,i,o,a,s){n=0===i&&void 0===r?t:e(n,t,i,o,a,s)})),n},e.flattenEach=l,e.flattenReduce=function(t,e,r){var n=r;return l(t,(function(t,i,o){n=0===i&&0===o&&void 0===r?t:e(n,t,i,o)})),n},e.segmentEach=h,e.segmentReduce=function(t,e,r){var n=r,i=!1;return h(t,(function(t,o,a,s,l){n=!1===i&&void 0===r?t:e(n,t,o,a,s,l),i=!0})),n},e.lineEach=c,e.lineReduce=function(t,e,r){var n=r;return c(t,(function(t,i,o,a){n=0===i&&void 0===r?t:e(n,t,i,o,a)})),n},e.findSegment=function(t,e){if(e=e||{},!n.isObject(e))throw new Error("options is invalid");var r,i=e.featureIndex||0,o=e.multiFeatureIndex||0,a=e.geometryIndex||0,s=e.segmentIndex||0,l=e.properties;switch(t.type){case"FeatureCollection":i<0&&(i=t.features.length+i),l=l||t.features[i].properties,r=t.features[i].geometry;break;case"Feature":l=l||t.properties,r=t.geometry;break;case"Point":case"MultiPoint":return null;case"LineString":case"Polygon":case"MultiLineString":case"MultiPolygon":r=t;break;default:throw new Error("geojson is invalid")}if(null===r)return null;var h=r.coordinates;switch(r.type){case"Point":case"MultiPoint":return null;case"LineString":return s<0&&(s=h.length+s-1),n.lineString([h[s],h[s+1]],l,e);case"Polygon":return a<0&&(a=h.length+a),s<0&&(s=h[a].length+s-1),n.lineString([h[a][s],h[a][s+1]],l,e);case"MultiLineString":return o<0&&(o=h.length+o),s<0&&(s=h[o].length+s-1),n.lineString([h[o][s],h[o][s+1]],l,e);case"MultiPolygon":return o<0&&(o=h.length+o),a<0&&(a=h[o].length+a),s<0&&(s=h[o][a].length-s-1),n.lineString([h[o][a][s],h[o][a][s+1]],l,e)}throw new Error("geojson is invalid")},e.findPoint=function(t,e){if(e=e||{},!n.isObject(e))throw new Error("options is invalid");var r,i=e.featureIndex||0,o=e.multiFeatureIndex||0,a=e.geometryIndex||0,s=e.coordIndex||0,l=e.properties;switch(t.type){case"FeatureCollection":i<0&&(i=t.features.length+i),l=l||t.features[i].properties,r=t.features[i].geometry;break;case"Feature":l=l||t.properties,r=t.geometry;break;case"Point":case"MultiPoint":return null;case"LineString":case"Polygon":case"MultiLineString":case"MultiPolygon":r=t;break;default:throw new Error("geojson is invalid")}if(null===r)return null;var h=r.coordinates;switch(r.type){case"Point":return n.point(h,l,e);case"MultiPoint":return o<0&&(o=h.length+o),n.point(h[o],l,e);case"LineString":return s<0&&(s=h.length+s),n.point(h[s],l,e);case"Polygon":return a<0&&(a=h.length+a),s<0&&(s=h[a].length+s),n.point(h[a][s],l,e);case"MultiLineString":return o<0&&(o=h.length+o),s<0&&(s=h[o].length+s),n.point(h[o][s],l,e);case"MultiPolygon":return o<0&&(o=h.length+o),a<0&&(a=h[o].length+a),s<0&&(s=h[o][a].length-s),n.point(h[o][a][s],l,e)}throw new Error("geojson is invalid")}},function(t,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n=r(25),i=6378137;function o(t){var e=0;if(t&&0<t.length){e+=Math.abs(a(t[0]));for(var r=1;r<t.length;r++)e-=Math.abs(a(t[r]))}return e}function a(t){var e,r,n,o,a,l,h=0,c=t.length;if(2<c){for(l=0;l<c;l++)a=l===c-2?(n=c-2,o=c-1,0):l===c-1?(n=c-1,o=0,1):(o=(n=l)+1,l+2),e=t[n],r=t[o],h+=(s(t[a][0])-s(e[0]))*Math.sin(s(r[1]));h=h*i*i/2}return h}function s(t){return t*Math.PI/180}e.default=function(t){return n.geomReduce(t,(function(t,e){return t+function(t){var e,r=0;switch(t.type){case"Polygon":return o(t.coordinates);case"MultiPolygon":for(e=0;e<t.coordinates.length;e++)r+=o(t.coordinates[e]);return r;case"Point":case"MultiPoint":case"LineString":case"MultiLineString":return 0}return 0}(e)}),0)}},function(t,e,r){var n=r(14)(r(3),"Map");t.exports=n},function(t,e,r){(function(e){var r="object"==typeof e&&e&&e.Object===Object&&e;t.exports=r}).call(this,r(70))},function(t,e,r){var n=r(77),i=r(84),o=r(86),a=r(87),s=r(88);function l(t){var e=-1,r=null==t?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}l.prototype.clear=n,l.prototype.delete=i,l.prototype.get=o,l.prototype.has=a,l.prototype.set=s,t.exports=l},function(t,e,r){var n=r(17),i=r(10);t.exports=function(t,e,r){(void 0===r||i(t[e],r))&&(void 0!==r||e in t)||n(t,e,r)}},function(t,e,r){var n=r(14),i=function(){try{var t=n(Object,"defineProperty");return t({},"",{}),t}catch(t){}}();t.exports=i},function(t,e,r){var n=r(99)(Object.getPrototypeOf,Object);t.exports=n},function(t,e){var r=Object.prototype;t.exports=function(t){var e=t&&t.constructor;return t===("function"==typeof e&&e.prototype||r)}},function(t,e,r){(function(t){var n=r(3),i=r(102),o=e&&!e.nodeType&&e,a=o&&"object"==typeof t&&t&&!t.nodeType&&t,s=a&&a.exports===o?n.Buffer:void 0,l=(s?s.isBuffer:void 0)||i;t.exports=l}).call(this,r(18)(t))},function(t,e,r){var n=r(104),i=r(105),o=r(106),a=o&&o.isTypedArray,s=a?i(a):n;t.exports=s},function(t,e){t.exports=function(t,e){if(("constructor"!==e||"function"!=typeof t[e])&&"__proto__"!=e)return t[e]}},function(t,e,r){var n=r(110),i=r(112),o=r(20);t.exports=function(t){return o(t)?n(t,!0):i(t)}},function(t,e){t.exports=function(t){return t}},function(t,e,r){var n=r(5),i=r(124),o=r(125),a=r(128);t.exports=function(t,e){return n(t)?t:i(t,e)?[t]:o(a(t))}},function(t,e,r){var n=r(23);t.exports=function(t){if("string"==typeof t||n(t))return t;var e=t+"";return"0"==e&&1/t==-1/0?"-0":e}},function(t){t.exports=JSON.parse('{"a":"2.3.0"}')},function(t,e,r){var n=r(57),i=r(114)((function(t,e,r){n(t,e,r)}));t.exports=i},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"Click to place marker","firstVertex":"Click to place first vertex","continueLine":"Click to continue drawing","finishLine":"Click any existing marker to finish","finishPoly":"Click first marker to finish","finishRect":"Click to finish","startCircle":"Click to place circle center","finishCircle":"Click to finish circle","placeCircleMarker":"Click to place circle marker"},"actions":{"finish":"Finish","cancel":"Cancel","removeLastVertex":"Remove Last Vertex"},"buttonTitles":{"drawMarkerButton":"Draw Marker","drawPolyButton":"Draw Polygons","drawLineButton":"Draw Polyline","drawCircleButton":"Draw Circle","drawRectButton":"Draw Rectangle","editButton":"Edit Layers","dragButton":"Drag Layers","cutButton":"Cut Layers","deleteButton":"Remove Layers","drawCircleMarkerButton":"Draw Circle Marker"}}')},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"Platziere den Marker mit Klick","firstVertex":"Platziere den ersten Marker mit Klick","continueLine":"Klicke, um weiter zu zeichnen","finishLine":"Beende mit Klick auf existierenden Marker","finishPoly":"Beende mit Klick auf ersten Marker","finishRect":"Beende mit Klick","startCircle":"Platziere das Kreiszentrum mit Klick","finishCircle":"Beende den Kreis mit Klick","placeCircleMarker":"Platziere den Kreismarker mit Klick"},"actions":{"finish":"Beenden","cancel":"Abbrechen","removeLastVertex":"Letzten Vertex löschen"},"buttonTitles":{"drawMarkerButton":"Marker zeichnen","drawPolyButton":"Polygon zeichnen","drawLineButton":"Polyline zeichnen","drawCircleButton":"Kreis zeichnen","drawRectButton":"Rechteck zeichnen","editButton":"Layer editieren","dragButton":"Layer bewegen","cutButton":"Layer schneiden","deleteButton":"Layer löschen","drawCircleMarkerButton":"Kreismarker zeichnen"}}')},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"Clicca per posizionare un Marker","firstVertex":"Clicca per posizionare il primo vertice","continueLine":"Clicca per continuare a disegnare","finishLine":"Clicca qualsiasi marker esistente per terminare","finishPoly":"Clicca il primo marker per terminare","finishRect":"Clicca per terminare","startCircle":"Clicca per posizionare il punto centrale del cerchio","finishCircle":"Clicca per terminare il cerchio","placeCircleMarker":"Clicca per posizionare un Marker del cherchio"},"actions":{"finish":"Termina","cancel":"Annulla","removeLastVertex":"Rimuovi l\'ultimo vertice"},"buttonTitles":{"drawMarkerButton":"Disegna Marker","drawPolyButton":"Disegna Poligoni","drawLineButton":"Disegna Polilinea","drawCircleButton":"Disegna Cerchio","drawRectButton":"Disegna Rettangolo","editButton":"Modifica Livelli","dragButton":"Sposta Livelli","cutButton":"Ritaglia Livelli","deleteButton":"Elimina Livelli","drawCircleMarkerButton":"Disegna Marker del Cherchio"}}')},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"Adaugă un punct","firstVertex":"Apasă aici pentru a adăuga primul Vertex","continueLine":"Apasă aici pentru a continua desenul","finishLine":"Apasă pe orice obiect pentru a finisa desenul","finishPoly":"Apasă pe primul obiect pentru a finisa","finishRect":"Apasă pentru a finisa","startCircle":"Apasă pentru a desena un cerc","finishCircle":"Apasă pentru a finisa un cerc","placeCircleMarker":"Adaugă un punct"},"actions":{"finish":"Termină","cancel":"Anulează","removeLastVertex":"Șterge ultimul Vertex"},"buttonTitles":{"drawMarkerButton":"Adaugă o bulină","drawPolyButton":"Desenează un poligon","drawLineButton":"Desenează o linie","drawCircleButton":"Desenează un cerc","drawRectButton":"Desenează un dreptunghi","editButton":"Editează straturile","dragButton":"Mută straturile","cutButton":"Taie straturile","deleteButton":"Șterge straturile","placeCircleMarker":"Adaugă o bulină"}}')},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"Щелкните, чтобы поместить маркер","firstVertex":"Нажмите, чтобы поместить первый объект","continueLine":"Нажмите, чтобы продолжить рисование","finishLine":"Щелкните любой существующий маркер для завершения","finishPoly":"Выберите первую точку, чтобы закончить","finishRect":"Нажмите, чтобы закончить","startCircle":"Нажмите чтобы добавить круг","finishCircle":"Нажмите чтобы закончить круг","placeCircleMarker":"Click to place circle marker"},"actions":{"finish":"Заканчивать","cancel":"Отмена","removeLastVertex":"Удалить последний объект на карте"},"buttonTitles":{"drawMarkerButton":"Добавить маркер","drawPolyButton":"Рисовать полигон","drawLineButton":"Рисовать Полилинию","drawCircleButton":"Рисовать круг","drawRectButton":"Рисовать Прямоугольник","editButton":"Редактировать слой","dragButton":"Перетаскивать слой","cutButton":"Вырезать слой","deleteButton":"Удалить слой","placeCircleMarker":"Щелкните, чтобы поместить маркер"}}')},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"Presiona para colocar un marcador","firstVertex":"Presiona para colocar el primer vértice","continueLine":"Presiona para continuar dibujando","finishLine":"Presiona cualquier marcador existente para finalizar","finishPoly":"Presiona el primer marcador para finalizar","finishRect":"Presiona para finalizar","startCircle":"Presiona para colocar el centro del circulo","finishCircle":"Presiona para finalizar el circulo","placeCircleMarker":"Presiona para colocar un marcador de circulo"},"actions":{"finish":"Finalizar","cancel":"Cancelar","removeLastVertex":"Remover ultimo vértice"},"buttonTitles":{"drawMarkerButton":"Dibujar Marcador","drawPolyButton":"Dibujar Polígono","drawLineButton":"Dibujar Línea","drawCircleButton":"Dibujar Circulo","drawRectButton":"Dibujar Rectángulo","editButton":"Editar Capas","dragButton":"Arrastrar Capas","cutButton":"Cortar Capas","deleteButton":"Remover Capas","drawCircleMarkerButton":"Dibujar Marcador de Circulo"}}')},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"Klik om een marker te plaatsen","firstVertex":"Klik om het eerste punt te plaatsen","continueLine":"Klik om te blijven tekenen","finishLine":"Klik op een bestaand punt om te beëindigen","finishPoly":"Klik op het eerst punt om te beëindigen","finishRect":"Klik om te beëindigen","startCircle":"Klik om het middelpunt te plaatsen","finishCircle":"Klik om de cirkel te beëindigen","placeCircleMarker":"Klik om een marker te plaatsen"},"actions":{"finish":"Bewaar","cancel":"Annuleer","removeLastVertex":"Verwijder laatste punt"},"buttonTitles":{"drawMarkerButton":"Plaats Marker","drawPolyButton":"Teken een vlak","drawLineButton":"Teken een lijn","drawCircleButton":"Teken een cirkel","drawRectButton":"Teken een vierkant","editButton":"Bewerk","dragButton":"Verplaats","cutButton":"Knip","deleteButton":"Verwijder","drawCircleMarkerButton":"Plaats Marker"}}')},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"Cliquez pour placer un marqueur","firstVertex":"Cliquez pour placer le premier sommet","continueLine":"Cliquez pour continuer à dessiner","finishLine":"Cliquez sur n\'importe quel marqueur pour terminer","finishPoly":"Cliquez sur le premier marqueur pour terminer","finishRect":"Cliquez pour terminer","startCircle":"Cliquez pour placer le centre du cercle","finishCircle":"Cliquez pour finir le cercle"},"actions":{"finish":"Terminer","cancel":"Annuler","removeLastVertex":"Retirer le dernier sommet"},"buttonTitles":{"drawMarkerButton":"Placer des marqueurs","drawPolyButton":"Dessiner des polygones","drawLineButton":"Dessiner des polylignes","drawCircleButton":"Dessiner un cercle","drawRectButton":"Dessiner un rectangle","editButton":"Éditer des calques","dragButton":"Déplacer des calques","cutButton":"Couper des calques","deleteButton":"Supprimer des calques"}}')},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"单击放置标记","firstVertex":"单击放置首个顶点","continueLine":"单击继续绘制","finishLine":"单击任何存在的标记以完成","finishPoly":"单击第一个标记以完成","finishRect":"单击完成","startCircle":"单击放置圆心","finishCircle":"单击完成圆形"},"actions":{"finish":"完成","cancel":"取消","removeLastVertex":"移除最后的顶点"},"buttonTitles":{"drawMarkerButton":"绘制标记","drawPolyButton":"绘制多边形","drawLineButton":"绘制线段","drawCircleButton":"绘制圆形","drawRectButton":"绘制长方形","editButton":"编辑图层","dragButton":"拖拽图层","cutButton":"剪切图层","deleteButton":"删除图层"}}')},function(t){t.exports=JSON.parse('{"tooltips":{"placeMarker":"Clique para posicionar o marcador","firstVertex":"Clique para posicionar o primeiro vértice","continueLine":"Clique para continuar desenhando","finishLine":"Clique em qualquer marcador existente para finalizar","finishPoly":"Clique no primeiro ponto para fechar o polígono","finishRect":"Clique para finalizar","startCircle":"Clique para posicionar o centro do círculo","finishCircle":"Clique para fechar o círculo"},"actions":{"finish":"Finalizar","cancel":"Cancelar","removeLastVertex":"Remover último vértice"},"buttonTitles":{"drawMarkerButton":"Desenhar um marcador","drawPolyButton":"Desenhar um polígono","drawLineButton":"Desenhar uma polilinha","drawCircleButton":"Desenhar um círculo","drawRectButton":"Desenhar um retângulo","editButton":"Editar camada(s)","dragButton":"Mover camada(s)","cutButton":"Recortar camada(s)","deleteButton":"Remover camada(s)"}}')},function(t,e,r){var n=r(131),i=r(132);t.exports=function(t,e){return null!=t&&i(t,e,n)}},function(t,e,r){"use strict";var n=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var r in t)Object.hasOwnProperty.call(t,r)&&(e[r]=t[r]);return e.default=t,e};Object.defineProperty(e,"__esModule",{value:!0});var i=r(1),o=r(13),a=n(r(24));e.default=function t(e,r,n){void 0===n&&(n={});var s=o.getGeom(e),l=o.getGeom(r);if("Polygon"===s.type&&"Polygon"===l.type){var h=a.intersection(s.coordinates,l.coordinates);if(null===h||0===h.length)return null;if(1!==h.length)return i.multiPolygon(h,n.properties);var c=h[0][0][0],u=h[0][0][h[0][0].length-1];return c[0]===u[0]&&c[1]===u[1]?i.polygon(h[0],n.properties):null}if("MultiPolygon"===s.type){for(var p=[],f=0,d=s.coordinates;f<d.length;f++){var g=d[f],_=t(o.getGeom(i.polygon(g)),l);if(_){var m=o.getGeom(_);if("Polygon"===m.type)p.push(m.coordinates);else{if("MultiPolygon"!==m.type)throw new Error("intersection is invalid");p=p.concat(m.coordinates)}}}return 0===p.length?null:1===p.length?i.polygon(p[0],n.properties):i.multiPolygon(p,n.properties)}if("MultiPolygon"===l.type)return t(l,s);throw new Error("poly1 and poly2 must be either polygons or multiPolygons")}},function(t,e,r){t.exports=r(135)},function(t,e){Array.prototype.findIndex=Array.prototype.findIndex||function(t){if(null===this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!=typeof t)throw new TypeError("callback must be a function");for(var e=Object(this),r=e.length>>>0,n=arguments[1],i=0;i<r;i++)if(t.call(n,e[i],i,e))return i;return-1},Array.prototype.find=Array.prototype.find||function(t){if(null===this)throw new TypeError("Array.prototype.find called on null or undefined");if("function"!=typeof t)throw new TypeError("callback must be a function");for(var e=Object(this),r=e.length>>>0,n=arguments[1],i=0;i<r;i++){var o=e[i];if(t.call(n,o,i,e))return o}},"function"!=typeof Object.assign&&(Object.assign=function(t){"use strict";if(null==t)throw new TypeError("Cannot convert undefined or null to object");t=Object(t);for(var e=1;e<arguments.length;e++){var r=arguments[e];if(null!=r)for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t}),[Element.prototype,CharacterData.prototype,DocumentType.prototype].forEach((function(t){t.hasOwnProperty("remove")||Object.defineProperty(t,"remove",{configurable:!0,enumerable:!0,writable:!0,value:function(){this.parentNode.removeChild(this)}})}))},function(t,e,r){var n=r(58),i=r(30),o=r(89),a=r(91),s=r(2),l=r(37),h=r(36);t.exports=function t(e,r,c,u,p){e!==r&&o(r,(function(o,l){if(p=p||new n,s(o))a(e,r,l,c,t,u,p);else{var f=u?u(h(e,l),o,l+"",e,r,p):void 0;void 0===f&&(f=o),i(e,l,f)}}),l)}},function(t,e,r){var n=r(8),i=r(64),o=r(65),a=r(66),s=r(67),l=r(68);function h(t){var e=this.__data__=new n(t);this.size=e.size}h.prototype.clear=i,h.prototype.delete=o,h.prototype.get=a,h.prototype.has=s,h.prototype.set=l,t.exports=h},function(t,e){t.exports=function(){this.__data__=[],this.size=0}},function(t,e,r){var n=r(9),i=Array.prototype.splice;t.exports=function(t){var e=this.__data__,r=n(e,t);return!(r<0||(r==e.length-1?e.pop():i.call(e,r,1),--this.size,0))}},function(t,e,r){var n=r(9);t.exports=function(t){var e=this.__data__,r=n(e,t);return r<0?void 0:e[r][1]}},function(t,e,r){var n=r(9);t.exports=function(t){return-1<n(this.__data__,t)}},function(t,e,r){var n=r(9);t.exports=function(t,e){var r=this.__data__,i=n(r,t);return i<0?(++this.size,r.push([t,e])):r[i][1]=e,this}},function(t,e,r){var n=r(8);t.exports=function(){this.__data__=new n,this.size=0}},function(t,e){t.exports=function(t){var e=this.__data__,r=e.delete(t);return this.size=e.size,r}},function(t,e){t.exports=function(t){return this.__data__.get(t)}},function(t,e){t.exports=function(t){return this.__data__.has(t)}},function(t,e,r){var n=r(8),i=r(27),o=r(29);t.exports=function(t,e){var r=this.__data__;if(r instanceof n){var a=r.__data__;if(!i||a.length<199)return a.push([t,e]),this.size=++r.size,this;r=this.__data__=new o(a)}return r.set(t,e),this.size=r.size,this}},function(t,e,r){var n=r(15),i=r(73),o=r(2),a=r(75),s=/^\[object .+?Constructor\]$/,l=Function.prototype,h=Object.prototype,c=l.toString,u=h.hasOwnProperty,p=RegExp("^"+c.call(u).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");t.exports=function(t){return!(!o(t)||i(t))&&(n(t)?p:s).test(a(t))}},function(t,e){var r;r=function(){return this}();try{r=r||new Function("return this")()}catch(t){"object"==typeof window&&(r=window)}t.exports=r},function(t,e,r){var n=r(16),i=Object.prototype,o=i.hasOwnProperty,a=i.toString,s=n?n.toStringTag:void 0;t.exports=function(t){var e=o.call(t,s),r=t[s];try{t[s]=void 0;var n=!0}catch(t){}var i=a.call(t);return n&&(e?t[s]=r:delete t[s]),i}},function(t,e){var r=Object.prototype.toString;t.exports=function(t){return r.call(t)}},function(t,e,r){var n,i=r(74),o=(n=/[^.]+$/.exec(i&&i.keys&&i.keys.IE_PROTO||""))?"Symbol(src)_1."+n:"";t.exports=function(t){return!!o&&o in t}},function(t,e,r){var n=r(3)["__core-js_shared__"];t.exports=n},function(t,e){var r=Function.prototype.toString;t.exports=function(t){if(null!=t){try{return r.call(t)}catch(t){}try{return t+""}catch(t){}}return""}},function(t,e){t.exports=function(t,e){return null==t?void 0:t[e]}},function(t,e,r){var n=r(78),i=r(8),o=r(27);t.exports=function(){this.size=0,this.__data__={hash:new n,map:new(o||i),string:new n}}},function(t,e,r){var n=r(79),i=r(80),o=r(81),a=r(82),s=r(83);function l(t){var e=-1,r=null==t?0:t.length;for(this.clear();++e<r;){var n=t[e];this.set(n[0],n[1])}}l.prototype.clear=n,l.prototype.delete=i,l.prototype.get=o,l.prototype.has=a,l.prototype.set=s,t.exports=l},function(t,e,r){var n=r(11);t.exports=function(){this.__data__=n?n(null):{},this.size=0}},function(t,e){t.exports=function(t){var e=this.has(t)&&delete this.__data__[t];return this.size-=e?1:0,e}},function(t,e,r){var n=r(11),i=Object.prototype.hasOwnProperty;t.exports=function(t){var e=this.__data__;if(n){var r=e[t];return"__lodash_hash_undefined__"===r?void 0:r}return i.call(e,t)?e[t]:void 0}},function(t,e,r){var n=r(11),i=Object.prototype.hasOwnProperty;t.exports=function(t){var e=this.__data__;return n?void 0!==e[t]:i.call(e,t)}},function(t,e,r){var n=r(11);t.exports=function(t,e){var r=this.__data__;return this.size+=this.has(t)?0:1,r[t]=n&&void 0===e?"__lodash_hash_undefined__":e,this}},function(t,e,r){var n=r(12);t.exports=function(t){var e=n(this,t).delete(t);return this.size-=e?1:0,e}},function(t,e){t.exports=function(t){var e=typeof t;return"string"==e||"number"==e||"symbol"==e||"boolean"==e?"__proto__"!==t:null===t}},function(t,e,r){var n=r(12);t.exports=function(t){return n(this,t).get(t)}},function(t,e,r){var n=r(12);t.exports=function(t){return n(this,t).has(t)}},function(t,e,r){var n=r(12);t.exports=function(t,e){var r=n(this,t),i=r.size;return r.set(t,e),this.size+=r.size==i?0:1,this}},function(t,e,r){var n=r(90)();t.exports=n},function(t,e){t.exports=function(t){return function(e,r,n){for(var i=-1,o=Object(e),a=n(e),s=a.length;s--;){var l=a[t?s:++i];if(!1===r(o[l],l,o))break}return e}}},function(t,e,r){var n=r(30),i=r(92),o=r(93),a=r(96),s=r(97),l=r(19),h=r(5),c=r(101),u=r(34),p=r(15),f=r(2),d=r(103),g=r(35),_=r(36),m=r(107);t.exports=function(t,e,r,y,v,L,b){var k=_(t,r),M=_(e,r),w=b.get(M);if(w)n(t,r,w);else{var C=L?L(k,M,r+"",t,e,b):void 0,x=void 0===C;if(x){var S=h(M),E=!S&&u(M),P=!S&&!E&&g(M);C=M,S||E||P?C=h(k)?k:c(k)?a(k):E?i(M,!(x=!1)):P?o(M,!(x=!1)):[]:d(M)||l(M)?l(C=k)?C=m(k):f(k)&&!p(k)||(C=s(M)):x=!1}x&&(b.set(M,C),v(C,M,y,L,b),b.delete(M)),n(t,r,C)}}},function(t,e,r){(function(t){var n=r(3),i=e&&!e.nodeType&&e,o=i&&"object"==typeof t&&t&&!t.nodeType&&t,a=o&&o.exports===i?n.Buffer:void 0,s=a?a.allocUnsafe:void 0;t.exports=function(t,e){if(e)return t.slice();var r=t.length,n=s?s(r):new t.constructor(r);return t.copy(n),n}}).call(this,r(18)(t))},function(t,e,r){var n=r(94);t.exports=function(t,e){var r=e?n(t.buffer):t.buffer;return new t.constructor(r,t.byteOffset,t.length)}},function(t,e,r){var n=r(95);t.exports=function(t){var e=new t.constructor(t.byteLength);return new n(e).set(new n(t)),e}},function(t,e,r){var n=r(3).Uint8Array;t.exports=n},function(t,e){t.exports=function(t,e){var r=-1,n=t.length;for(e=e||Array(n);++r<n;)e[r]=t[r];return e}},function(t,e,r){var n=r(98),i=r(32),o=r(33);t.exports=function(t){return"function"!=typeof t.constructor||o(t)?{}:n(i(t))}},function(t,e,r){var n=r(2),i=Object.create;function o(){}t.exports=function(t){if(!n(t))return{};if(i)return i(t);o.prototype=t;var e=new o;return o.prototype=void 0,e}},function(t,e){t.exports=function(t,e){return function(r){return t(e(r))}}},function(t,e,r){var n=r(7),i=r(4);t.exports=function(t){return i(t)&&"[object Arguments]"==n(t)}},function(t,e,r){var n=r(20),i=r(4);t.exports=function(t){return i(t)&&n(t)}},function(t,e){t.exports=function(){return!1}},function(t,e,r){var n=r(7),i=r(32),o=r(4),a=Function.prototype,s=Object.prototype,l=a.toString,h=s.hasOwnProperty,c=l.call(Object);t.exports=function(t){if(!o(t)||"[object Object]"!=n(t))return!1;var e=i(t);if(null===e)return!0;var r=h.call(e,"constructor")&&e.constructor;return"function"==typeof r&&r instanceof r&&l.call(r)==c}},function(t,e,r){var n=r(7),i=r(21),o=r(4),a={};a["[object Float32Array]"]=a["[object Float64Array]"]=a["[object Int8Array]"]=a["[object Int16Array]"]=a["[object Int32Array]"]=a["[object Uint8Array]"]=a["[object Uint8ClampedArray]"]=a["[object Uint16Array]"]=a["[object Uint32Array]"]=!0,a["[object Arguments]"]=a["[object Array]"]=a["[object ArrayBuffer]"]=a["[object Boolean]"]=a["[object DataView]"]=a["[object Date]"]=a["[object Error]"]=a["[object Function]"]=a["[object Map]"]=a["[object Number]"]=a["[object Object]"]=a["[object RegExp]"]=a["[object Set]"]=a["[object String]"]=a["[object WeakMap]"]=!1,t.exports=function(t){return o(t)&&i(t.length)&&!!a[n(t)]}},function(t,e){t.exports=function(t){return function(e){return t(e)}}},function(t,e,r){(function(t){var n=r(28),i=e&&!e.nodeType&&e,o=i&&"object"==typeof t&&t&&!t.nodeType&&t,a=o&&o.exports===i&&n.process,s=function(){try{return o&&o.require&&o.require("util").types||a&&a.binding&&a.binding("util")}catch(t){}}();t.exports=s}).call(this,r(18)(t))},function(t,e,r){var n=r(108),i=r(37);t.exports=function(t){return n(t,i(t))}},function(t,e,r){var n=r(109),i=r(17);t.exports=function(t,e,r,o){var a=!r;r=r||{};for(var s=-1,l=e.length;++s<l;){var h=e[s],c=o?o(r[h],t[h],h,r,t):void 0;void 0===c&&(c=t[h]),a?i(r,h,c):n(r,h,c)}return r}},function(t,e,r){var n=r(17),i=r(10),o=Object.prototype.hasOwnProperty;t.exports=function(t,e,r){var a=t[e];o.call(t,e)&&i(a,r)&&(void 0!==r||e in t)||n(t,e,r)}},function(t,e,r){var n=r(111),i=r(19),o=r(5),a=r(34),s=r(22),l=r(35),h=Object.prototype.hasOwnProperty;t.exports=function(t,e){var r=o(t),c=!r&&i(t),u=!r&&!c&&a(t),p=!r&&!c&&!u&&l(t),f=r||c||u||p,d=f?n(t.length,String):[],g=d.length;for(var _ in t)!e&&!h.call(t,_)||f&&("length"==_||u&&("offset"==_||"parent"==_)||p&&("buffer"==_||"byteLength"==_||"byteOffset"==_)||s(_,g))||d.push(_);return d}},function(t,e){t.exports=function(t,e){for(var r=-1,n=Array(t);++r<t;)n[r]=e(r);return n}},function(t,e,r){var n=r(2),i=r(33),o=r(113),a=Object.prototype.hasOwnProperty;t.exports=function(t){if(!n(t))return o(t);var e=i(t),r=[];for(var s in t)("constructor"!=s||!e&&a.call(t,s))&&r.push(s);return r}},function(t,e){t.exports=function(t){var e=[];if(null!=t)for(var r in Object(t))e.push(r);return e}},function(t,e,r){var n=r(115),i=r(122);t.exports=function(t){return n((function(e,r){var n=-1,o=r.length,a=1<o?r[o-1]:void 0,s=2<o?r[2]:void 0;for(a=3<t.length&&"function"==typeof a?(o--,a):void 0,s&&i(r[0],r[1],s)&&(a=o<3?void 0:a,o=1),e=Object(e);++n<o;){var l=r[n];l&&t(e,l,n,a)}return e}))}},function(t,e,r){var n=r(38),i=r(116),o=r(118);t.exports=function(t,e){return o(i(t,e,n),t+"")}},function(t,e,r){var n=r(117),i=Math.max;t.exports=function(t,e,r){return e=i(void 0===e?t.length-1:e,0),function(){for(var o=arguments,a=-1,s=i(o.length-e,0),l=Array(s);++a<s;)l[a]=o[e+a];a=-1;for(var h=Array(e+1);++a<e;)h[a]=o[a];return h[e]=r(l),n(t,this,h)}}},function(t,e){t.exports=function(t,e,r){switch(r.length){case 0:return t.call(e);case 1:return t.call(e,r[0]);case 2:return t.call(e,r[0],r[1]);case 3:return t.call(e,r[0],r[1],r[2])}return t.apply(e,r)}},function(t,e,r){var n=r(119),i=r(121)(n);t.exports=i},function(t,e,r){var n=r(120),i=r(31),o=r(38),a=i?function(t,e){return i(t,"toString",{configurable:!0,enumerable:!1,value:n(e),writable:!0})}:o;t.exports=a},function(t,e){t.exports=function(t){return function(){return t}}},function(t,e){var r=Date.now;t.exports=function(t){var e=0,n=0;return function(){var i=r(),o=16-(i-n);if(n=i,0<o){if(800<=++e)return arguments[0]}else e=0;return t.apply(void 0,arguments)}}},function(t,e,r){var n=r(10),i=r(20),o=r(22),a=r(2);t.exports=function(t,e,r){if(!a(r))return!1;var s=typeof e;return!!("number"==s?i(r)&&o(e,r.length):"string"==s&&e in r)&&n(r[e],t)}},function(t,e,r){var n=r(39),i=r(40);t.exports=function(t,e){for(var r=0,o=(e=n(e,t)).length;null!=t&&r<o;)t=t[i(e[r++])];return r&&r==o?t:void 0}},function(t,e,r){var n=r(5),i=r(23),o=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,a=/^\w*$/;t.exports=function(t,e){if(n(t))return!1;var r=typeof t;return!("number"!=r&&"symbol"!=r&&"boolean"!=r&&null!=t&&!i(t))||a.test(t)||!o.test(t)||null!=e&&t in Object(e)}},function(t,e,r){var n=r(126),i=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,o=/\\(\\)?/g,a=n((function(t){var e=[];return 46===t.charCodeAt(0)&&e.push(""),t.replace(i,(function(t,r,n,i){e.push(n?i.replace(o,"$1"):r||t)})),e}));t.exports=a},function(t,e,r){var n=r(127);t.exports=function(t){var e=n(t,(function(t){return 500===r.size&&r.clear(),t})),r=e.cache;return e}},function(t,e,r){var n=r(29),i="Expected a function";function o(t,e){if("function"!=typeof t||null!=e&&"function"!=typeof e)throw new TypeError(i);var r=function(){var n=arguments,i=e?e.apply(this,n):n[0],o=r.cache;if(o.has(i))return o.get(i);var a=t.apply(this,n);return r.cache=o.set(i,a)||o,a};return r.cache=new(o.Cache||n),r}o.Cache=n,t.exports=o},function(t,e,r){var n=r(129);t.exports=function(t){return null==t?"":n(t)}},function(t,e,r){var n=r(16),i=r(130),o=r(5),a=r(23),s=n?n.prototype:void 0,l=s?s.toString:void 0;t.exports=function t(e){if("string"==typeof e)return e;if(o(e))return i(e,t)+"";if(a(e))return l?l.call(e):"";var r=e+"";return"0"==r&&1/e==-1/0?"-0":r}},function(t,e){t.exports=function(t,e){for(var r=-1,n=null==t?0:t.length,i=Array(n);++r<n;)i[r]=e(t[r],r,t);return i}},function(t,e){var r=Object.prototype.hasOwnProperty;t.exports=function(t,e){return null!=t&&r.call(t,e)}},function(t,e,r){var n=r(39),i=r(19),o=r(5),a=r(22),s=r(21),l=r(40);t.exports=function(t,e,r){for(var h=-1,c=(e=n(e,t)).length,u=!1;++h<c;){var p=l(e[h]);if(!(u=null!=t&&r(t,p)))break;t=t[p]}return u||++h!=c?u:!!(c=null==t?0:t.length)&&s(c)&&a(p,c)&&(o(t)||i(t))}},function(t,e,r){},function(t,e,r){},function(t,e,r){"use strict";r.r(e),r(56);var n=r(41),i=r(42),o=r.n(i),a=r(43),s=r(44),l=r(45),h=r(46),c=r(47),u=r(48),p=r(49),f=r(50),d=r(51),g={en:a,de:s,it:l,ro:h,ru:c,es:u,nl:p,fr:f,pt_br:r(52),zh:d},_=L.Class.extend({initialize:function(t){this.map=t,this.Draw=new L.PM.Draw(t),this.Toolbar=new L.PM.Toolbar(t),this._globalRemovalMode=!1},setLang:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"en",e=1<arguments.length?arguments[1]:void 0,r=2<arguments.length&&void 0!==arguments[2]?arguments[2]:"en";e&&(g[t]=o()(g[r],e)),L.PM.activeLang=t,this.map.pm.Toolbar.reinit()},addControls:function(t){this.Toolbar.addControls(t)},removeControls:function(){this.Toolbar.removeControls()},toggleControls:function(){this.Toolbar.toggleControls()},controlsVisible:function(){return this.Toolbar.isVisible},enableDraw:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"Polygon",e=1<arguments.length?arguments[1]:void 0;"Poly"===t&&(t="Polygon"),this.Draw.enable(t,e)},disableDraw:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"Polygon";"Poly"===t&&(t="Polygon"),this.Draw.disable(t)},setPathOptions:function(t){this.Draw.setPathOptions(t)},findLayers:function(){var t=[];return this.map.eachLayer((function(e){(e instanceof L.Polyline||e instanceof L.Marker||e instanceof L.Circle||e instanceof L.CircleMarker)&&t.push(e)})),t=(t=t.filter((function(t){return!!t.pm}))).filter((function(t){return!t._pmTempLayer}))},removeLayer:function(t){var e=t.target;e._pmTempLayer||e.pm&&e.pm.dragging()||(e.remove(),this.map.fire("pm:remove",{layer:e}))},globalDragModeEnabled:function(){return!!this._globalDragMode},enableGlobalDragMode:function(){var t=this.findLayers();this._globalDragMode=!0,t.forEach((function(t){t.pm.enableLayerDrag()})),this.map.on("layeradd",this.layerAddHandler,this),this.Toolbar.toggleButton("dragMode",this._globalDragMode),this._fireDragModeEvent(!0)},disableGlobalDragMode:function(){var t=this.findLayers();this._globalDragMode=!1,t.forEach((function(t){t.pm.disableLayerDrag()})),this.map.off("layeradd",this.layerAddHandler,this),this.Toolbar.toggleButton("dragMode",this._globalDragMode),this._fireDragModeEvent(!1)},_fireDragModeEvent:function(t){this.map.fire("pm:globaldragmodetoggled",{enabled:t,map:this.map})},toggleGlobalDragMode:function(){this.globalDragModeEnabled()?this.disableGlobalDragMode():this.enableGlobalDragMode()},layerAddHandler:function(t){var e=t.layer;!e.pm||e._pmTempLayer||(this.globalRemovalEnabled()&&(this.disableGlobalRemovalMode(),this.enableGlobalRemovalMode()),this.globalEditEnabled()&&(this.disableGlobalEditMode(),this.enableGlobalEditMode()),this.globalDragModeEnabled()&&(this.disableGlobalDragMode(),this.enableGlobalDragMode()))},disableGlobalRemovalMode:function(){var t=this;this._globalRemovalMode=!1,this.map.eachLayer((function(e){e.off("click",t.removeLayer,t)})),this.map.off("layeradd",this.layerAddHandler,this),this.Toolbar.toggleButton("deleteLayer",this._globalRemovalMode),this._fireRemovalModeEvent(!1)},enableGlobalRemovalMode:function(){var t=this;this._globalRemovalMode=!0,this.map.eachLayer((function(e){(function(t){return t.pm&&!(t.pm.options&&t.pm.options.preventMarkerRemoval)&&!(t instanceof L.LayerGroup)})(e)&&e.on("click",t.removeLayer,t)})),this.map.on("layeradd",this.layerAddHandler,this),this.Toolbar.toggleButton("deleteLayer",this._globalRemovalMode),this._fireRemovalModeEvent(!0)},_fireRemovalModeEvent:function(t){this.map.fire("pm:globalremovalmodetoggled",{enabled:t,map:this.map})},toggleGlobalRemovalMode:function(){this.globalRemovalEnabled()?this.disableGlobalRemovalMode():this.enableGlobalRemovalMode()},globalRemovalEnabled:function(){return!!this._globalRemovalMode},globalEditEnabled:function(){return this._globalEditMode},enableGlobalEditMode:function(t){var e=this.findLayers();this._globalEditMode=!0,e.forEach((function(e){e.pm.enable(t)})),this.map.on("layeradd",this.layerAddHandler,this),this.Toolbar.toggleButton("editPolygon",this._globalEditMode),this._fireEditModeEvent(!0)},disableGlobalEditMode:function(){var t=this.findLayers();this._globalEditMode=!1,t.forEach((function(t){t.pm.disable()})),this.map.on("layeroff",this.layerAddHandler,this),this.Toolbar.toggleButton("editPolygon",this._globalEditMode),this._fireEditModeEvent(!1)},_fireEditModeEvent:function(t){this.map.fire("pm:globaleditmodetoggled",{enabled:t,map:this.map})},toggleGlobalEditMode:function(t){this.globalEditEnabled()?this.disableGlobalEditMode():this.enableGlobalEditMode(t)}}),m=r(0),y=r.n(m),v=r(53),b=r.n(v);function k(t){var e=L.PM.activeLang;return b()(g,e)||(e="en"),y()(g[e],t)}var M=L.Control.extend({options:{position:"topleft"},initialize:function(t){this._button=L.Util.setOptions(this,t)},onAdd:function(t){return this._map=t,this._container="edit"===this._button.tool?this._map.pm.Toolbar.editContainer:this._map.pm.Toolbar.drawContainer,this.buttonsDomNode=this._makeButton(this._button),this._container.appendChild(this.buttonsDomNode),this._container},onRemove:function(){return this.buttonsDomNode.remove(),this._container},getText:function(){return this._button.text},getIconUrl:function(){return this._button.iconUrl},destroy:function(){this._button={},this._update()},toggle:function(t){return this._button.toggleStatus="boolean"==typeof t?t:!this._button.toggleStatus,this._applyStyleClasses(),this._button.toggleStatus},toggled:function(){return this._button.toggleStatus},onCreate:function(){this.toggle(!1)},_triggerClick:function(t){this._button.onClick(t),this._clicked(t),this._button.afterClick(t)},_makeButton:function(t){var e=this,r=L.DomUtil.create("div","button-container",this._container),n=L.DomUtil.create("a","leaflet-buttons-control-button",r),i=L.DomUtil.create("div","leaflet-pm-actions-container",r),o=t.actions,a={cancel:{text:k("actions.cancel"),onClick:function(){this._triggerClick()}},removeLastVertex:{text:k("actions.removeLastVertex"),onClick:function(){this._map.pm.Draw[t.jsClass]._removeLastVertex()}},finish:{text:k("actions.finish"),onClick:function(e){this._map.pm.Draw[t.jsClass]._finishShape(e)}}};o.forEach((function(t){var r=a[t],n=L.DomUtil.create("a","leaflet-pm-action action-".concat(t),i);n.innerHTML=r.text,L.DomEvent.addListener(n,"click",r.onClick,e),L.DomEvent.disableClickPropagation(n)})),t.toggleStatus&&L.DomUtil.addClass(n,"active");var s=L.DomUtil.create("div","control-icon",n);return t.title&&s.setAttribute("title",t.title),t.iconUrl&&s.setAttribute("src",t.iconUrl),t.className&&L.DomUtil.addClass(s,t.className),L.DomEvent.addListener(n,"click",(function(){e._button.disableOtherButtons&&e._map.pm.Toolbar.triggerClickOnToggledButtons(e)})),L.DomEvent.addListener(n,"click",this._triggerClick,this),L.DomEvent.disableClickPropagation(n),r},_applyStyleClasses:function(){this._container&&(this._button.toggleStatus?L.DomUtil.addClass(this.buttonsDomNode,"active"):L.DomUtil.removeClass(this.buttonsDomNode,"active"))},_clicked:function(){this._button.doToggle&&this.toggle()}});L.Control.PMButton=M;var w=L.Class.extend({options:{drawMarker:!0,drawRectangle:!0,drawPolyline:!0,drawPolygon:!0,drawCircle:!0,drawCircleMarker:!0,editMode:!0,dragMode:!0,cutPolygon:!0,removalMode:!0,position:"topleft"},initialize:function(t){this.init(t)},reinit:function(){var t=this.isVisible;this.removeControls(),this._defineButtons(),t&&this.addControls()},init:function(t){this.map=t,this.buttons={},this.isVisible=!1,this.drawContainer=L.DomUtil.create("div","leaflet-pm-toolbar leaflet-pm-draw leaflet-bar leaflet-control"),this.editContainer=L.DomUtil.create("div","leaflet-pm-toolbar leaflet-pm-edit leaflet-bar leaflet-control"),this._defineButtons()},getButtons:function(){return this.buttons},addControls:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:this.options;void 0!==t.editPolygon&&(t.editMode=t.editPolygon),void 0!==t.deleteLayer&&(t.removalMode=t.deleteLayer),L.Util.setOptions(this,t),this.applyIconStyle(),this._showHideButtons(),this.isVisible=!0},applyIconStyle:function(){var t=this.getButtons(),e={geomanIcons:{drawMarker:"control-icon leaflet-pm-icon-marker",drawPolyline:"control-icon leaflet-pm-icon-polyline",drawRectangle:"control-icon leaflet-pm-icon-rectangle",drawPolygon:"control-icon leaflet-pm-icon-polygon",drawCircle:"control-icon leaflet-pm-icon-circle",drawCircleMarker:"control-icon leaflet-pm-icon-circle-marker",editMode:"control-icon leaflet-pm-icon-edit",dragMode:"control-icon leaflet-pm-icon-drag",cutPolygon:"control-icon leaflet-pm-icon-cut",removalMode:"control-icon leaflet-pm-icon-delete"}};for(var r in t){var n=t[r];L.Util.setOptions(n,{className:e.geomanIcons[r]})}},removeControls:function(){var t=this.getButtons();for(var e in t)t[e].remove();this.isVisible=!1},toggleControls:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:this.options;this.isVisible?this.removeControls():this.addControls(t)},_addButton:function(t,e){return this.buttons[t]=e,this.options[t]=this.options[t]||!1,this.buttons[t]},triggerClickOnToggledButtons:function(t){for(var e in this.buttons)this.buttons[e]!==t&&this.buttons[e].toggled()&&this.buttons[e]._triggerClick()},toggleButton:function(t,e){return"editPolygon"===t&&(t="editMode"),"deleteLayer"===t&&(t="removalMode"),this.triggerClickOnToggledButtons(this.buttons[t]),this.buttons[t].toggle(e)},_defineButtons:function(){var t=this,e={className:"control-icon leaflet-pm-icon-marker",title:k("buttonTitles.drawMarkerButton"),jsClass:"Marker",onClick:function(){},afterClick:function(){t.map.pm.Draw.Marker.toggle()},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,actions:["cancel"]},r={title:k("buttonTitles.drawPolyButton"),className:"control-icon leaflet-pm-icon-polygon",jsClass:"Polygon",onClick:function(){},afterClick:function(){t.map.pm.Draw.Polygon.toggle()},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,actions:["finish","removeLastVertex","cancel"]},n={className:"control-icon leaflet-pm-icon-polyline",title:k("buttonTitles.drawLineButton"),jsClass:"Line",onClick:function(){},afterClick:function(){t.map.pm.Draw.Line.toggle()},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,actions:["finish","removeLastVertex","cancel"]},i={title:k("buttonTitles.drawCircleButton"),className:"control-icon leaflet-pm-icon-circle",jsClass:"Circle",onClick:function(){},afterClick:function(){t.map.pm.Draw.Circle.toggle()},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,actions:["cancel"]},o={title:k("buttonTitles.drawCircleMarkerButton"),className:"control-icon leaflet-pm-icon-circle-marker",jsClass:"CircleMarker",onClick:function(){},afterClick:function(){t.map.pm.Draw.CircleMarker.toggle()},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,actions:["cancel"]},a={title:k("buttonTitles.drawRectButton"),className:"control-icon leaflet-pm-icon-rectangle",jsClass:"Rectangle",onClick:function(){},afterClick:function(){t.map.pm.Draw.Rectangle.toggle()},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,actions:["cancel"]},s={title:k("buttonTitles.editButton"),className:"control-icon leaflet-pm-icon-edit",onClick:function(){},afterClick:function(){t.map.pm.toggleGlobalEditMode()},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,tool:"edit",actions:["cancel"]},l={title:k("buttonTitles.dragButton"),className:"control-icon leaflet-pm-icon-drag",onClick:function(){},afterClick:function(){t.map.pm.toggleGlobalDragMode()},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,tool:"edit",actions:["cancel"]},h={title:k("buttonTitles.cutButton"),className:"control-icon leaflet-pm-icon-cut",jsClass:"Cut",onClick:function(){},afterClick:function(){t.map.pm.Draw.Cut.toggle({snappable:!0,cursorMarker:!0,allowSelfIntersection:!1})},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,tool:"edit",actions:["finish","removeLastVertex","cancel"]},c={title:k("buttonTitles.deleteButton"),className:"control-icon leaflet-pm-icon-delete",onClick:function(){},afterClick:function(){t.map.pm.toggleGlobalRemovalMode()},doToggle:!0,toggleStatus:!1,disableOtherButtons:!0,position:this.options.position,tool:"edit",actions:["cancel"]};this._addButton("drawMarker",new L.Control.PMButton(e)),this._addButton("drawPolyline",new L.Control.PMButton(n)),this._addButton("drawRectangle",new L.Control.PMButton(a)),this._addButton("drawPolygon",new L.Control.PMButton(r)),this._addButton("drawCircle",new L.Control.PMButton(i)),this._addButton("drawCircleMarker",new L.Control.PMButton(o)),this._addButton("editMode",new L.Control.PMButton(s)),this._addButton("dragMode",new L.Control.PMButton(l)),this._addButton("cutPolygon",new L.Control.PMButton(h)),this._addButton("removalMode",new L.Control.PMButton(c))},_showHideButtons:function(){this.removeControls();var t=this.getButtons();for(var e in t)this.options[e]&&(t[e].setPosition(this.options.position),t[e].addTo(this.map))}}),C=function(t,e,r){var n=t.project(e),i=t.project(r);return t.unproject(n._add(i)._divideBy(2))},x={_initSnappableMarkers:function(){this.options.snapDistance=this.options.snapDistance||30,this._assignEvents(this._markers),this._layer.off("pm:dragstart",this._unsnap,this),this._layer.on("pm:dragstart",this._unsnap,this)},_assignEvents:function(t){var e=this;t.forEach((function(t){Array.isArray(t)?e._assignEvents(t):(t.off("drag",e._handleSnapping,e),t.on("drag",e._handleSnapping,e),t.off("dragend",e._cleanupSnapping,e),t.on("dragend",e._cleanupSnapping,e))}))},_unsnap:function(){delete this._snapLatLng},_cleanupSnapping:function(){delete this._snapList,this._map.off("pm:remove",this._handleSnapLayerRemoval,this),this.debugIndicatorLines&&this.debugIndicatorLines.forEach((function(t){t.remove()}))},_handleSnapLayerRemoval:function(t){var e=t.layer,r=this._snapList.findIndex((function(t){return t._leaflet_id===e._leaflet_id}));this._snapList.splice(r,1)},_handleSnapping:function(t){var e=this;if(t.originalEvent.altKey)return!1;if(void 0===this._snapList&&(this._createSnapList(),this._map.off("layeradd",this._createSnapList,this),this._map.on("layeradd",this._createSnapList,this)),this._snapList.length<=0)return!1;var r,n=t.target,i=this._calcClosestLayer(n.getLatLng(),this._snapList),o=i.layer instanceof L.Marker||i.layer instanceof L.CircleMarker;r=o?i.latlng:this._checkPrioritiySnapping(i);var a=this.options.snapDistance,s={marker:n,snapLatLng:r,segment:i.segment,layer:this._layer,layerInteractedWith:i.layer,distance:i.distance};if(s.marker.fire("pm:snapdrag",s),this._layer.fire("pm:snapdrag",s),i.distance<a){n.setLatLng(r),n._snapped=!0;var l=this._snapLatLng||{},h=r||{};l.lat===h.lat&&l.lng===h.lng||(e._snapLatLng=r,n.fire("pm:snap",s),e._layer.fire("pm:snap",s))}else this._snapLatLng&&(this._unsnap(s),n._snapped=!1,s.marker.fire("pm:unsnap",s),this._layer.fire("pm:unsnap",s));return!0},_checkPrioritiySnapping:function(t){var e,r=this._map,n=t.segment[0],i=t.segment[1],o=t.latlng,a=this._getDistance(r,n,o),s=this._getDistance(r,i,o),l=a<s?n:i,h=a<s?a:s;if(this.options.snapMiddle){var c=C(r,n,i),u=this._getDistance(r,c,o);u<a&&u<s&&(l=c,h=u)}return e=h<this.options.snapDistance?l:o,Object.assign({},e)},_createSnapList:function(){var t=this,e=[],r=[],n=this._map;n.off("pm:remove",this._handleSnapLayerRemoval,this),n.on("pm:remove",this._handleSnapLayerRemoval,this),n.eachLayer((function(t){if((t instanceof L.Polyline||t instanceof L.Marker||t instanceof L.CircleMarker)&&!0!==t.options.snapIgnore){e.push(t);var n=L.polyline([],{color:"red",pmIgnore:!0});n._pmTempLayer=!0,r.push(n)}})),e=(e=(e=e.filter((function(e){return t._layer!==e}))).filter((function(t){return t._latlng||t._latlngs&&0<t._latlngs.length}))).filter((function(t){return!t._pmTempLayer})),this._otherSnapLayers?this._snapList=e.concat(this._otherSnapLayers):this._snapList=e,this.debugIndicatorLines=r},_calcClosestLayer:function(t,e){var r=this,n={};return e.forEach((function(e,i){var o=r._calcLayerDistances(t,e);r.debugIndicatorLines[i].setLatLngs([t,o.latlng]),(void 0===n.distance||o.distance<n.distance)&&((n=o).layer=e)})),n},_calcLayerDistances:function(t,e){var r,n,i=this,o=this._map,a=e instanceof L.Marker||e instanceof L.CircleMarker,s=e instanceof L.Polygon,l=t,h=a?e.getLatLng():e.getLatLngs();if(a)return{latlng:Object.assign({},h),distance:this._getDistance(o,h,l)};!function t(e){e.forEach((function(a,h){if(Array.isArray(a))t(a);else{var c,u=a;c=s?h+1===e.length?0:h+1:h+1===e.length?void 0:h+1;var p=e[c];if(p){var f=i._getDistanceToSegment(o,l,u,p);(void 0===n||f<n)&&(n=f,r=[u,p])}}}))}(h);var c=this._getClosestPointOnSegment(o,t,r[0],r[1]);return{latlng:Object.assign({},c),segment:r,distance:n}},_getClosestPointOnSegment:function(t,e,r,n){var i=t.getMaxZoom();i===1/0&&(i=t.getZoom());var o=t.project(e,i),a=t.project(r,i),s=t.project(n,i),l=L.LineUtil.closestPointOnSegment(o,a,s);return t.unproject(l,i)},_getDistanceToSegment:function(t,e,r,n){var i=t.latLngToLayerPoint(e),o=t.latLngToLayerPoint(r),a=t.latLngToLayerPoint(n);return L.LineUtil.pointToSegmentDistance(i,o,a)},_getDistance:function(t,e,r){return t.latLngToLayerPoint(e).distanceTo(t.latLngToLayerPoint(r))}},S=L.Class.extend({includes:[x],options:{snappable:!0,snapDistance:20,tooltips:!0,cursorMarker:!0,finishOnDoubleClick:!1,finishOn:null,allowSelfIntersection:!0,templineStyle:{},hintlineStyle:{color:"#3388ff",dashArray:"5,5"},markerStyle:{draggable:!0}},initialize:function(t){var e=this;this._map=t,this.shapes=["Marker","CircleMarker","Line","Polygon","Rectangle","Circle","Cut"],this.shapes.forEach((function(t){e[t]=new L.PM.Draw[t](e._map)}))},setPathOptions:function(t){this.options.pathOptions=t},getShapes:function(){return this.shapes},enable:function(t,e){if(!t)throw new Error("Error: Please pass a shape as a parameter. Possible shapes are: ".concat(this.getShapes().join(",")));this.disable(),this[t].enable(e)},disable:function(){var t=this;this.shapes.forEach((function(e){t[e].disable()}))},addControls:function(){var t=this;this.shapes.forEach((function(e){t[e].addButton()}))}});S.Marker=S.extend({initialize:function(t){this._map=t,this._shape="Marker",this.toolbarButtonName="drawMarker"},enable:function(t){var e=this;L.Util.setOptions(this,t),this._enabled=!0,this._map.on("click",this._createMarker,this),this._map.pm.Toolbar.toggleButton(this.toolbarButtonName,!0),this._hintMarker=L.marker([0,0],this.options.markerStyle),this._hintMarker._pmTempLayer=!0,this._hintMarker.addTo(this._map),this.options.tooltips&&this._hintMarker.bindTooltip(k("tooltips.placeMarker"),{permanent:!0,offset:L.point(0,10),direction:"bottom",opacity:.8}).openTooltip(),this._layer=this._hintMarker,this._map.on("mousemove",this._syncHintMarker,this),this._map.fire("pm:drawstart",{shape:this._shape,workingLayer:this._layer}),this._map.eachLayer((function(t){e.isRelevantMarker(t)&&t.pm.enable()}))},disable:function(){var t=this;this._enabled&&(this._map.off("click",this._createMarker,this),this._hintMarker.remove(),this._map.off("mousemove",this._syncHintMarker,this),this._map.eachLayer((function(e){t.isRelevantMarker(e)&&e.pm.disable()})),this._map.fire("pm:drawend",{shape:this._shape}),this._map.pm.Toolbar.toggleButton(this.toolbarButtonName,!1),this.options.snappable&&this._cleanupSnapping(),this._enabled=!1)},isRelevantMarker:function(t){return t instanceof L.Marker&&t.pm&&!t._pmTempLayer},enabled:function(){return this._enabled},toggle:function(t){this.enabled()?this.disable():this.enable(t)},_createMarker:function(t){if(t.latlng){this._hintMarker._snapped||this._hintMarker.setLatLng(t.latlng);var e=this._hintMarker.getLatLng(),r=new L.Marker(e,this.options.markerStyle);r.addTo(this._map),r.pm.enable(),this._map.fire("pm:create",{shape:this._shape,marker:r,layer:r}),this._cleanupSnapping()}},_syncHintMarker:function(t){if(this._hintMarker.setLatLng(t.latlng),this.options.snappable){var e=t;e.target=this._hintMarker,this._handleSnapping(e)}}});var E=r(6),P=r.n(E);S.Line=S.extend({initialize:function(t){this._map=t,this._shape="Line",this.toolbarButtonName="drawPolyline",this._doesSelfIntersect=!1},enable:function(t){L.Util.setOptions(this,t),this.options.finishOnDoubleClick&&!this.options.finishOn&&(this.options.finishOn="dblclick"),this._enabled=!0,this._layerGroup=new L.LayerGroup,this._layerGroup._pmTempLayer=!0,this._layerGroup.addTo(this._map),this._layer=L.polyline([],this.options.templineStyle),this._layer._pmTempLayer=!0,this._layerGroup.addLayer(this._layer),this._hintline=L.polyline([],this.options.hintlineStyle),this._hintline._pmTempLayer=!0,this._layerGroup.addLayer(this._hintline),this._hintMarker=L.marker(this._map.getCenter(),{icon:L.divIcon({className:"marker-icon cursor-marker"})}),this._hintMarker._pmTempLayer=!0,this._layerGroup.addLayer(this._hintMarker),this.options.cursorMarker&&L.DomUtil.addClass(this._hintMarker._icon,"visible"),this.options.tooltips&&this._hintMarker.bindTooltip(k("tooltips.firstVertex"),{permanent:!0,offset:L.point(0,10),direction:"bottom",opacity:.8}).openTooltip(),this._map._container.style.cursor="crosshair",this._map.on("click",this._createVertex,this),this.options.finishOn&&this._map.on(this.options.finishOn,this._finishShape,this),"dblclick"===this.options.finishOn&&(this.tempMapDoubleClickZoomState=this._map.doubleClickZoom._enabled,this.tempMapDoubleClickZoomState&&this._map.doubleClickZoom.disable()),this._map.on("mousemove",this._syncHintMarker,this),this._hintMarker.on("move",this._syncHintLine,this),this._map.fire("pm:drawstart",{shape:this._shape,workingLayer:this._layer}),this._map.pm.Toolbar.toggleButton(this.toolbarButtonName,!0),this._otherSnapLayers=[]},disable:function(){this._enabled&&(this._enabled=!1,this._map._container.style.cursor="",this._map.off("click",this._createVertex,this),this._map.off("mousemove",this._syncHintMarker,this),this.options.finishOn&&this._map.off(this.options.finishOn,this._finishShape,this),this.tempMapDoubleClickZoomState&&this._map.doubleClickZoom.enable(),this._map.removeLayer(this._layerGroup),this._map.fire("pm:drawend",{shape:this._shape}),this._map.pm.Toolbar.toggleButton(this.toolbarButtonName,!1),this.options.snappable&&this._cleanupSnapping())},enabled:function(){return this._enabled},toggle:function(t){this.enabled()?this.disable():this.enable(t)},hasSelfIntersection:function(){return 0<P()(this._layer.toGeoJSON(15)).features.length},_syncHintLine:function(){var t=this._layer.getLatLngs();if(0<t.length){var e=t[t.length-1];this._hintline.setLatLngs([e,this._hintMarker.getLatLng()])}},_syncHintMarker:function(t){if(this._hintMarker.setLatLng(t.latlng),this.options.snappable){var e=t;e.target=this._hintMarker,this._handleSnapping(e)}this.options.allowSelfIntersection||this._handleSelfIntersection(!0,t.latlng)},_handleSelfIntersection:function(t,e){var r=L.polyline(this._layer.getLatLngs());t&&(e=e||this._hintMarker.getLatLng(),r.addLatLng(e));var n=P()(r.toGeoJSON(15));this._doesSelfIntersect=0<n.features.length,this._doesSelfIntersect?this._hintline.setStyle({color:"red"}):this._hintline.setStyle(this.options.hintlineStyle)},_removeLastVertex:function(){var t=this._layer.getLatLngs(),e=t.pop();if(t.length<1)this.disable();else{var r=this._layerGroup.getLayers().filter((function(t){return t instanceof L.Marker})).filter((function(t){return!L.DomUtil.hasClass(t._icon,"cursor-marker")})).find((function(t){return t.getLatLng()===e}));this._layerGroup.removeLayer(r),this._layer.setLatLngs(t),this._syncHintLine()}},_createVertex:function(t){if(this.options.allowSelfIntersection||(this._handleSelfIntersection(!0,t.latlng),!this._doesSelfIntersect)){this._hintMarker._snapped||this._hintMarker.setLatLng(t.latlng);var e=this._hintMarker.getLatLng();if(e.equals(this._layer.getLatLngs()[0]))this._finishShape(t);else{var r=0===this._layer.getLatLngs().length;this._layer.addLatLng(e);var n=this._createMarker(e,r);this._hintline.setLatLngs([e,e]),this._layer.fire("pm:vertexadded",{shape:this._shape,workingLayer:this._layer,marker:n,latlng:e})}}},_finishShape:function(){if(this.options.allowSelfIntersection||(this._handleSelfIntersection(!1),!this._doesSelfIntersect)){var t=this._layer.getLatLngs();if(!(t.length<=1)){var e=L.polyline(t,this.options.pathOptions).addTo(this._map);this.disable(),this._map.fire("pm:create",{shape:this._shape,layer:e}),this.options.snappable&&this._cleanupSnapping()}}},_createMarker:function(t,e){var r=new L.Marker(t,{draggable:!1,icon:L.divIcon({className:"marker-icon"})});return r._pmTempLayer=!0,this._layerGroup.addLayer(r),r.on("click",this._finishShape,this),e&&this._hintMarker.setTooltipContent(k("tooltips.continueLine")),2===this._layer.getLatLngs().length&&this._hintMarker.setTooltipContent(k("tooltips.finishLine")),r}}),S.Polygon=S.Line.extend({initialize:function(t){this._map=t,this._shape="Polygon",this.toolbarButtonName="drawPolygon"},_finishShape:function(t){if(this.options.allowSelfIntersection||(this._handleSelfIntersection(!1),!this._doesSelfIntersect)){var e=this._layer.getLatLngs();if(!(e.length<=2)){t&&"dblclick"===t.type&&e.splice(e.length-1,1);var r=L.polygon(e,this.options.pathOptions).addTo(this._map);this.disable(),this._map.fire("pm:create",{shape:this._shape,layer:r}),this._cleanupSnapping(),this._otherSnapLayers.splice(this._tempSnapLayerIndex,1),delete this._tempSnapLayerIndex}}},_createMarker:function(t,e){var r=new L.Marker(t,{draggable:!1,icon:L.divIcon({className:"marker-icon"})});return r._pmTempLayer=!0,this._layerGroup.addLayer(r),e&&(r.on("click",this._finishShape,this),this._tempSnapLayerIndex=this._otherSnapLayers.push(r)-1,this.options.snappable&&this._cleanupSnapping()),e&&this._hintMarker.setTooltipContent(k("tooltips.continueLine")),3===this._layer.getLatLngs().length&&this._hintMarker.setTooltipContent(k("tooltips.finishPoly")),r}}),S.Rectangle=S.extend({initialize:function(t){this._map=t,this._shape="Rectangle",this.toolbarButtonName="drawRectangle"},enable:function(t){if(L.Util.setOptions(this,t),this._enabled=!0,this._layerGroup=new L.LayerGroup,this._layerGroup._pmTempLayer=!0,this._layerGroup.addTo(this._map),this._layer=L.rectangle([[0,0],[0,0]],this.options.pathOptions),this._layer._pmTempLayer=!0,this._startMarker=L.marker([0,0],{icon:L.divIcon({className:"marker-icon rect-start-marker"}),draggable:!0,zIndexOffset:100,opacity:this.options.cursorMarker?1:0}),this._startMarker._pmTempLayer=!0,this._layerGroup.addLayer(this._startMarker),this._hintMarker=L.marker([0,0],{icon:L.divIcon({className:"marker-icon cursor-marker"})}),this._hintMarker._pmTempLayer=!0,this._layerGroup.addLayer(this._hintMarker),this.options.tooltips&&this._hintMarker.bindTooltip(k("tooltips.firstVertex"),{permanent:!0,offset:L.point(0,10),direction:"bottom",opacity:.8}).openTooltip(),this.options.cursorMarker){L.DomUtil.addClass(this._hintMarker._icon,"visible"),this._styleMarkers=[];for(var e=0;e<2;e+=1){var r=L.marker([0,0],{icon:L.divIcon({className:"marker-icon rect-style-marker"}),draggable:!0,zIndexOffset:100});r._pmTempLayer=!0,this._layerGroup.addLayer(r),this._styleMarkers.push(r)}}this._map._container.style.cursor="crosshair",this._map.on("click",this._placeStartingMarkers,this),this._map.on("mousemove",this._syncHintMarker,this),this._map.fire("pm:drawstart",{shape:this._shape,workingLayer:this._layer}),this._map.pm.Toolbar.toggleButton(this.toolbarButtonName,!0),this._otherSnapLayers=[]},disable:function(){this._enabled&&(this._enabled=!1,this._map._container.style.cursor="",this._map.off("click",this._finishShape,this),this._map.off("click",this._placeStartingMarkers,this),this._map.off("mousemove",this._syncHintMarker,this),this._map.removeLayer(this._layerGroup),this._map.fire("pm:drawend",{shape:this._shape}),this._map.pm.Toolbar.toggleButton(this.toolbarButtonName,!1),this.options.snappable&&this._cleanupSnapping())},enabled:function(){return this._enabled},toggle:function(t){this.enabled()?this.disable():this.enable(t)},_placeStartingMarkers:function(t){this._hintMarker._snapped||this._hintMarker.setLatLng(t.latlng);var e=this._hintMarker.getLatLng();L.DomUtil.addClass(this._startMarker._icon,"visible"),this._startMarker.setLatLng(e),this.options.cursorMarker&&this._styleMarkers&&this._styleMarkers.forEach((function(t){L.DomUtil.addClass(t._icon,"visible"),t.setLatLng(e)})),this._map.off("click",this._placeStartingMarkers,this),this._map.on("click",this._finishShape,this),this._hintMarker.setTooltipContent(k("tooltips.finishRect")),this._setRectangleOrigin()},_setRectangleOrigin:function(){var t=this._startMarker.getLatLng();t&&(this._layerGroup.addLayer(this._layer),this._layer.setLatLngs([t,t]),this._hintMarker.on("move",this._syncRectangleSize,this))},_syncHintMarker:function(t){if(this._hintMarker.setLatLng(t.latlng),this.options.snappable){var e=t;e.target=this._hintMarker,this._handleSnapping(e)}},_syncRectangleSize:function(){var t=this,e=this._startMarker.getLatLng(),r=this._hintMarker.getLatLng();if(this._layer.setBounds([e,r]),this.options.cursorMarker&&this._styleMarkers){var n=this._findCorners(),i=[];n.forEach((function(e){e.equals(t._startMarker.getLatLng())||e.equals(t._hintMarker.getLatLng())||i.push(e)})),i.forEach((function(e,r){t._styleMarkers[r].setLatLng(e)}))}},_finishShape:function(t){this._hintMarker._snapped||this._hintMarker.setLatLng(t.latlng);var e=this._hintMarker.getLatLng(),r=this._startMarker.getLatLng(),n=L.rectangle([r,e],this.options.pathOptions).addTo(this._map);this.disable(),this._map.fire("pm:create",{shape:this._shape,layer:n})},_findCorners:function(){var t=this._layer.getBounds();return[t.getNorthWest(),t.getNorthEast(),t.getSouthEast(),t.getSouthWest()]}}),S.Circle=S.extend({initialize:function(t){this._map=t,this._shape="Circle",this.toolbarButtonName="drawCircle"},enable:function(t){L.Util.setOptions(this,t),this.options.radius=0,this._enabled=!0,this._layerGroup=new L.LayerGroup,this._layerGroup._pmTempLayer=!0,this._layerGroup.addTo(this._map),this._layer=L.circle([0,0],this.options.templineStyle),this._layer._pmTempLayer=!0,this._layerGroup.addLayer(this._layer),this._centerMarker=L.marker([0,0],{icon:L.divIcon({className:"marker-icon"}),draggable:!1,zIndexOffset:100}),this._centerMarker._pmTempLayer=!0,this._layerGroup.addLayer(this._centerMarker),this._hintMarker=L.marker([0,0],{icon:L.divIcon({className:"marker-icon cursor-marker"})}),this._hintMarker._pmTempLayer=!0,this._layerGroup.addLayer(this._hintMarker),this.options.cursorMarker&&L.DomUtil.addClass(this._hintMarker._icon,"visible"),this.options.tooltips&&this._hintMarker.bindTooltip(k("tooltips.startCircle"),{permanent:!0,offset:L.point(0,10),direction:"bottom",opacity:.8}).openTooltip(),this._hintline=L.polyline([],this.options.hintlineStyle),this._hintline._pmTempLayer=!0,this._layerGroup.addLayer(this._hintline),this._map._container.style.cursor="crosshair",this._map.on("click",this._placeCenterMarker,this),this._map.on("mousemove",this._syncHintMarker,this),this._map.fire("pm:drawstart",{shape:this._shape,workingLayer:this._layer}),this._map.pm.Toolbar.toggleButton(this.toolbarButtonName,!0),this._otherSnapLayers=[]},disable:function(){this._enabled&&(this._enabled=!1,this._map._container.style.cursor="",this._map.off("click",this._finishShape,this),this._map.off("click",this._placeCenterMarker,this),this._map.off("mousemove",this._syncHintMarker,this),this._map.removeLayer(this._layerGroup),this._map.fire("pm:drawend",{shape:this._shape}),this._map.pm.Toolbar.toggleButton(this.toolbarButtonName,!1),this.options.snappable&&this._cleanupSnapping())},enabled:function(){return this._enabled},toggle:function(t){this.enabled()?this.disable():this.enable(t)},_syncHintLine:function(){var t=this._centerMarker.getLatLng();this._hintline.setLatLngs([t,this._hintMarker.getLatLng()])},_syncCircleRadius:function(){var t=this._centerMarker.getLatLng(),e=this._hintMarker.getLatLng(),r=t.distanceTo(e);this._layer.setRadius(r)},_syncHintMarker:function(t){if(this._hintMarker.setLatLng(t.latlng),this.options.snappable){var e=t;e.target=this._hintMarker,this._handleSnapping(e)}},_placeCenterMarker:function(t){this._hintMarker._snapped||this._hintMarker.setLatLng(t.latlng);var e=this._hintMarker.getLatLng();this._centerMarker.setLatLng(e),this._map.off("click",this._placeCenterMarker,this),this._map.on("click",this._finishShape,this),this._placeCircleCenter()},_placeCircleCenter:function(){var t=this._centerMarker.getLatLng();t&&(this._layer.setLatLng(t),this._hintMarker.on("move",this._syncHintLine,this),this._hintMarker.on("move",this._syncCircleRadius,this),this._hintMarker.setTooltipContent(k("tooltips.finishCircle")),this._layer.fire("pm:centerplaced",{shape:this._shape,workingLayer:this._layer,latlng:t}))},_finishShape:function(t){var e=this._centerMarker.getLatLng(),r=t.latlng,n=e.distanceTo(r),i=Object.assign({},this.options.pathOptions,{radius:n}),o=L.circle(e,i).addTo(this._map);this.disable(),this._map.fire("pm:create",{shape:this._shape,layer:o})},_createMarker:function(t){var e=new L.Marker(t,{draggable:!1,icon:L.divIcon({className:"marker-icon"})});return e._pmTempLayer=!0,this._layerGroup.addLayer(e),e}}),S.CircleMarker=S.Marker.extend({initialize:function(t){this._map=t,this._shape="CircleMarker",this.toolbarButtonName="drawCircleMarker"},enable:function(t){var e=this;L.Util.setOptions(this,t),this._enabled=!0,this._map.on("click",this._createMarker,this),this._map.pm.Toolbar.toggleButton(this.toolbarButtonName,!0),this._hintMarker=L.circleMarker([0,0],this.options.templineStyle),this._hintMarker._pmTempLayer=!0,this._hintMarker.addTo(this._map),this.options.tooltips&&this._hintMarker.bindTooltip(k("tooltips.placeCircleMarker"),{permanent:!0,offset:L.point(0,10),direction:"bottom",opacity:.8}).openTooltip(),this._layer=this._hintMarker,this._map.on("mousemove",this._syncHintMarker,this),this._map.fire("pm:drawstart",{shape:this._shape,workingLayer:this._layer}),this._map.eachLayer((function(t){e.isRelevantMarker(t)&&t.pm.enable()}))},isRelevantMarker:function(t){return t instanceof L.CircleMarker&&!(t instanceof L.Circle)&&t.pm&&!t._pmTempLayer},_createMarker:function(t){if(t.latlng){this._hintMarker._snapped||this._hintMarker.setLatLng(t.latlng);var e=this._hintMarker.getLatLng(),r=L.circleMarker(e,this.options.pathOptions);r.addTo(this._map),r.pm.enable(),this._map.fire("pm:create",{shape:this._shape,marker:r,layer:r}),this._cleanupSnapping()}}});var O=r(54),B=r.n(O),T=r(24),D=r(26),j=r.n(D),I=r(1),R=r(13),G=r(25);function A(t){switch(t.type){case"Polygon":return 1<j()(t)?t:null;case"MultiPolygon":var e=[];if(Object(G.flattenEach)(t,(function(t){1<j()(t)&&e.push(t.geometry.coordinates)})),e.length)return{type:"MultiPolygon",coordinates:e}}}S.Cut=S.Polygon.extend({initialize:function(t){this._map=t,this._shape="Cut",this.toolbarButtonName="cutPolygon"},_cut:function(t){var e=this,r=this._map._layers;Object.keys(r).map((function(t){return r[t]})).filter((function(t){return t.pm})).filter((function(t){return t instanceof L.Polygon})).filter((function(e){return e!==t})).filter((function(e){try{return!!B()(t.toGeoJSON(15),e.toGeoJSON(15))}catch(t){return console.error("You cant cut polygons with self-intersections"),!1}})).forEach((function(r){var n=function(t,e){var r=Object(R.getGeom)(t),n=Object(R.getGeom)(e),i=t.properties||{};if(r=A(r),n=A(n),!r)return null;if(!n)return Object(I.feature)(r,i);var o=T.diff(r.coordinates,n.coordinates);return 0===o.length?null:1===o.length?Object(I.polygon)(o[0],i):Object(I.multiPolygon)(o,i)}(r.toGeoJSON(15),t.toGeoJSON(15)),i=L.geoJSON(n,r.options).addTo(e._map);i.addTo(e._map),i.pm.enable(e.options),i.pm.disable(),r.fire("pm:cut",{shape:e._shape,layer:i,originalLayer:r}),e._map.fire("pm:cut",{shape:e._shape,layer:i,originalLayer:r}),r._pmTempLayer=!0,t._pmTempLayer=!0,r.remove(),t.remove(),0===i.getLayers().length&&e._map.pm.removeLayer({target:i})}))},_finishShape:function(){if(this.options.allowSelfIntersection||(this._handleSelfIntersection(!1),!this._doesSelfIntersect)){var t=this._layer.getLatLngs(),e=L.polygon(t,this.options.pathOptions);this._cut(e),this.disable(),this._cleanupSnapping(),this._otherSnapLayers.splice(this._tempSnapLayerIndex,1),delete this._tempSnapLayerIndex}}});var N={enableLayerDrag:function(){if(this._layer instanceof L.Marker)this._layer.dragging.enable();else{this._tempDragCoord=null;var t=this._layer._path?this._layer._path:this._layer._renderer._container;L.DomUtil.addClass(t,"leaflet-pm-draggable"),this._originalMapDragState=this._layer._map.dragging._enabled,this._safeToCacheDragState=!0,this._layer.on("mousedown",this._dragMixinOnMouseDown,this)}},disableLayerDrag:function(){if(this._layer instanceof L.Marker)this._layer.dragging.disable();else{var t=this._layer._path?this._layer._path:this._layer._renderer._container;L.DomUtil.removeClass(t,"leaflet-pm-draggable"),this._safeToCacheDragState=!1,this._layer.off("mousedown",this._dragMixinOnMouseDown,this)}},_dragMixinOnMouseUp:function(){var t=this,e=this._layer._path?this._layer._path:this._layer._renderer._container;return this._originalMapDragState&&this._layer._map.dragging.enable(),this._safeToCacheDragState=!0,this._layer._map.off("mousemove",this._dragMixinOnMouseMove,this),this._layer._map.off("mouseup",this._dragMixinOnMouseUp,this),!!this._dragging&&(window.setTimeout((function(){t._dragging=!1,L.DomUtil.removeClass(e,"leaflet-pm-dragging"),t._layer.fire("pm:dragend"),t._fireEdit()}),10),!0)},_dragMixinOnMouseMove:function(t){var e=this._layer._path?this._layer._path:this._layer._renderer._container;this._dragging||(this._dragging=!0,L.DomUtil.addClass(e,"leaflet-pm-dragging"),this._layer.bringToFront(),this._originalMapDragState&&this._layer._map.dragging.disable(),this._layer.fire("pm:dragstart")),this._onLayerDrag(t)},_dragMixinOnMouseDown:function(t){0<t.originalEvent.button||(this._safeToCacheDragState&&(this._originalMapDragState=this._layer._map.dragging._enabled,this._safeToCacheDragState=!1),this._tempDragCoord=t.latlng,this._layer._map.on("mouseup",this._dragMixinOnMouseUp,this),this._layer._map.on("mousemove",this._dragMixinOnMouseMove,this))},dragging:function(){return this._dragging},_onLayerDrag:function(t){var e=t.latlng,r=e.lat-this._tempDragCoord.lat,n=e.lng-this._tempDragCoord.lng;if(this._layer instanceof L.CircleMarker)this._layer.setLatLng(e);else{var i=function t(e){return e.map((function(e){return Array.isArray(e)?t(e):{lat:e.lat+r,lng:e.lng+n}}))}(this._layer.getLatLngs());this._layer.setLatLngs(i)}this._tempDragCoord=e,this._layer.fire("pm:drag",t)}},z=L.Class.extend({includes:[N,x],options:{snappable:!0,snapDistance:20,allowSelfIntersection:!0,draggable:!0},isPolygon:function(){return this._layer instanceof L.Polygon}});z.LayerGroup=L.Class.extend({initialize:function(t){var e=this;this._layerGroup=t,this._layers=this.findLayers(),this._layers.forEach((function(t){return e._initLayer(t)})),this._layerGroup.on("layeradd",(function(t){t.target._pmTempLayer||(e._layers=e.findLayers(),t.layer.pm&&e._initLayer(t.layer),t.target.pm.enabled()&&e.enable(e.getOptions()))}))},findLayers:function(){var t=this._layerGroup.getLayers();return(t=(t=t.filter((function(t){return!(t instanceof L.LayerGroup)}))).filter((function(t){return!!t.pm}))).filter((function(t){return!t._pmTempLayer}))},_initLayer:function(t){var e=this;["pm:edit","pm:update","pm:remove","pm:dragstart","pm:drag","pm:dragend","pm:snap","pm:unsnap","pm:cut","pm:intersect","pm:raiseMarkers","pm:markerdragend","pm:markerdragstart","pm:vertexadded","pm:vertexremoved","pm:centerplaced"].forEach((function(r){t.on(r,e._fireEvent,e)})),t.pm._layerGroup=this._layerGroup},_fireEvent:function(t){this._layerGroup.fireEvent(t.type,t)},toggleEdit:function(t){this._options=t,this._layers.forEach((function(e){e.pm.toggleEdit(t)}))},enable:function(t){this._options=t,this._layers.forEach((function(e){e.pm.enable(t)}))},disable:function(){this._layers.forEach((function(t){t.pm.disable()}))},enabled:function(){var t=this._layers.find((function(t){return t.pm.enabled()}));return!!t},dragging:function(){var t=this._layers.find((function(t){return t.pm.dragging()}));return!!t},getOptions:function(){return this._options}}),z.Marker=z.extend({initialize:function(t){this._layer=t,this._enabled=!1,this._layer.on("dragend",this._onDragEnd,this)},toggleEdit:function(t){this.enabled()?this.disable():this.enable(t)},enable:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{draggable:!0,snappable:!0};L.Util.setOptions(this,t),this._map=this._layer._map,this.enabled()||(this._enabled=!0,this.options.preventMarkerRemoval||this._layer.on("contextmenu",this._removeMarker,this),this.options.draggable&&this._layer.dragging.enable(),this.options.snappable&&this._initSnappableMarkers())},enabled:function(){return this._enabled},disable:function(){this._enabled=!1,this._layer.dragging&&this._layer.dragging.disable(),this._layer.off("contextmenu",this._removeMarker,this),this._layerEdited&&this._layer.fire("pm:update",{}),this._layerEdited=!1},_removeMarker:function(t){var e=t.target;e.remove(),e.fire("pm:remove")},_onDragEnd:function(t){t.target.fire("pm:edit"),this._layerEdited=!0},_initSnappableMarkers:function(){var t=this._layer;this.options.snapDistance=this.options.snapDistance||30,t.off("drag",this._handleSnapping,this),t.on("drag",this._handleSnapping,this),t.off("dragend",this._cleanupSnapping,this),t.on("dragend",this._cleanupSnapping,this),t.off("pm:dragstart",this._unsnap,this),t.on("pm:dragstart",this._unsnap,this)}}),z.Line=z.extend({initialize:function(t){this._layer=t,this._enabled=!1},toggleEdit:function(t){return this.enabled()?this.disable():this.enable(t),this.enabled()},enable:function(t){L.Util.setOptions(this,t),this._map=this._layer._map,this._map&&(this.enabled()||this.disable(),this._enabled=!0,this._initMarkers(),this._layer.on("remove",this._onLayerRemove,this),this.options.allowSelfIntersection||this._layer.on("pm:vertexremoved",this._handleSelfIntersectionOnVertexRemoval,this),this.options.allowSelfIntersection||(this.cachedColor=this._layer.options.color,this.isRed=!1,this._handleLayerStyle()))},_onLayerRemove:function(t){this.disable(t.target)},enabled:function(){return this._enabled},disable:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:this._layer;if(!this.enabled())return!1;if(t.pm._dragging)return!1;t.pm._enabled=!1,t.pm._markerGroup.clearLayers(),t.off("mousedown"),t.off("mouseup"),this._layer.off("remove",this._onLayerRemove,this),this.options.allowSelfIntersection||this._layer.off("pm:vertexremoved",this._handleSelfIntersectionOnVertexRemoval);var e=t._path?t._path:this._layer._renderer._container;return L.DomUtil.removeClass(e,"leaflet-pm-draggable"),this.hasSelfIntersection()&&L.DomUtil.removeClass(e,"leaflet-pm-invalid"),this._layerEdited&&this._layer.fire("pm:update",{}),!(this._layerEdited=!1)},hasSelfIntersection:function(){return 0<P()(this._layer.toGeoJSON(15)).features.length},_handleSelfIntersectionOnVertexRemoval:function(){this._handleLayerStyle(!0),this.hasSelfIntersection()&&(this._layer.setLatLngs(this._coordsBeforeEdit),this._coordsBeforeEdit=null,this._initMarkers())},_handleLayerStyle:function(t){var e=this,r=this._layer;if(this.hasSelfIntersection()){if(this.isRed)return;t?(r.setStyle({color:"red"}),this.isRed=!0,window.setTimeout((function(){r.setStyle({color:e.cachedColor}),e.isRed=!1}),200)):(r.setStyle({color:"red"}),this.isRed=!0),this._layer.fire("pm:intersect",{intersection:P()(this._layer.toGeoJSON(15))})}else r.setStyle({color:this.cachedColor}),this.isRed=!1},_initMarkers:function(){var t=this,e=this._map,r=this._layer.getLatLngs();this._markerGroup&&this._markerGroup.clearLayers(),this._markerGroup=new L.LayerGroup,this._markerGroup._pmTempLayer=!0,e.addLayer(this._markerGroup);this._markers=function e(r){if(Array.isArray(r[0]))return r.map(e,t);var n=r.map(t._createMarker,t);return r.map((function(e,i){var o=t.isPolygon()?(i+1)%r.length:i+1;return t._createMiddleMarker(n[i],n[o])})),n}(r),this.options.snappable&&this._initSnappableMarkers()},_createMarker:function(t){var e=new L.Marker(t,{draggable:!0,icon:L.divIcon({className:"marker-icon"})});return e._pmTempLayer=!0,e.on("dragstart",this._onMarkerDragStart,this),e.on("move",this._onMarkerDrag,this),e.on("dragend",this._onMarkerDragEnd,this),this.options.preventMarkerRemoval||e.on("contextmenu",this._removeMarker,this),this._markerGroup.addLayer(e),e},_createMiddleMarker:function(t,e){var r=this;if(!t||!e)return!1;var n=C(this._map,t.getLatLng(),e.getLatLng()),i=this._createMarker(n),o=L.divIcon({className:"marker-icon marker-icon-middle"});return i.setIcon(o),t._middleMarkerNext=i,(e._middleMarkerPrev=i).on("click",(function(){var n=L.divIcon({className:"marker-icon"});i.setIcon(n),r._addMarker(i,t,e)})),i.on("movestart",(function(){i.on("moveend",(function(){var t=L.divIcon({className:"marker-icon"});i.setIcon(t),i.off("moveend")})),r._addMarker(i,t,e)})),i},_addMarker:function(t,e,r){t.off("movestart"),t.off("click");var n=t.getLatLng(),i=this._layer._latlngs,o=this.findDeepMarkerIndex(this._markers,e),a=o.indexPath,s=o.index,l=o.parentPath,h=1<a.length?y()(i,l):i,c=1<a.length?y()(this._markers,l):this._markers;h.splice(s+1,0,n),c.splice(s+1,0,t),this._layer.setLatLngs(i),this._createMiddleMarker(e,t),this._createMiddleMarker(t,r),this._fireEdit(),this._layer.fire("pm:vertexadded",{layer:this._layer,marker:t,indexPath:this.findDeepMarkerIndex(this._markers,t).indexPath,latlng:n}),this.options.snappable&&this._initSnappableMarkers()},_removeMarker:function(t){if(!this.options.allowSelfIntersection){var e=this._layer.getLatLngs();this._coordsBeforeEdit=JSON.parse(JSON.stringify(e))}var r=t.target,n=this._layer.getLatLngs(),i=this.findDeepMarkerIndex(this._markers,r),o=i.indexPath,a=i.index,s=i.parentPath;if(o){var l,h,c=1<o.length?y()(n,s):n,u=1<o.length?y()(this._markers,s):this._markers;if(c.splice(a,1),this._layer.setLatLngs(n),c.length<=1&&(c.splice(0,c.length),this._layer.setLatLngs(n),this.disable(),this.enable(this.options)),function(t){return!function t(e){return e.filter((function(t){return![null,"",void 0].includes(t)})).reduce((function(e,r){return e.concat(Array.isArray(r)?t(r):r)}),[])}(t).length}(n)&&this._layer.remove(),r._middleMarkerPrev&&this._markerGroup.removeLayer(r._middleMarkerPrev),r._middleMarkerNext&&this._markerGroup.removeLayer(r._middleMarkerNext),this._markerGroup.removeLayer(r),this.isPolygon()?(l=(a+1)%u.length,h=(a+(u.length-1))%u.length):(h=a-1<0?void 0:a-1,l=a+1>=u.length?void 0:a+1),l!==h){var p=u[h],f=u[l];this._createMiddleMarker(p,f)}u.splice(a,1),this._fireEdit(),this._layer.fire("pm:vertexremoved",{layer:this._layer,marker:r,indexPath:o})}},findDeepMarkerIndex:function(t,e){var r;t.some(function t(n){return function(i,o){var a=n.concat(o);return i._leaflet_id===e._leaflet_id?(r=a,!0):Array.isArray(i)&&i.some(t(a))}}([]));var n={};return r&&(n={indexPath:r,index:r[r.length-1],parentPath:r.slice(0,r.length-1)}),n},updatePolygonCoordsFromMarkerDrag:function(t){var e=this._layer.getLatLngs(),r=t.getLatLng(),n=this.findDeepMarkerIndex(this._markers,t),i=n.indexPath,o=n.index,a=n.parentPath;(1<i.length?y()(e,a):e).splice(o,1,r),this._layer.setLatLngs(e)},_onMarkerDrag:function(t){var e=t.target,r=this.findDeepMarkerIndex(this._markers,e),n=r.indexPath,i=r.index,o=r.parentPath;if(n){this.updatePolygonCoordsFromMarkerDrag(e);var a=1<n.length?y()(this._markers,o):this._markers,s=(i+1)%a.length,l=(i+(a.length-1))%a.length,h=e.getLatLng(),c=a[l].getLatLng(),u=a[s].getLatLng();if(e._middleMarkerNext){var p=C(this._map,h,u);e._middleMarkerNext.setLatLng(p)}if(e._middleMarkerPrev){var f=C(this._map,h,c);e._middleMarkerPrev.setLatLng(f)}this.options.allowSelfIntersection||this._handleLayerStyle()}},_onMarkerDragEnd:function(t){var e=t.target,r=this.findDeepMarkerIndex(this._markers,e).indexPath;if(!this.options.allowSelfIntersection&&this.hasSelfIntersection())return this._layer.setLatLngs(this._coordsBeforeEdit),this._coordsBeforeEdit=null,this._initMarkers(),void this._handleLayerStyle();this._layer.fire("pm:markerdragend",{markerEvent:t,indexPath:r}),this._fireEdit()},_onMarkerDragStart:function(t){var e=t.target,r=this.findDeepMarkerIndex(this._markers,e).indexPath;this._layer.fire("pm:markerdragstart",{markerEvent:t,indexPath:r}),this.options.allowSelfIntersection||(this._coordsBeforeEdit=this._layer.getLatLngs()),this.cachedColor=this._layer.options.color},_fireEdit:function(){this._layerEdited=!0,this._layer.fire("pm:edit")}}),z.Polygon=z.Line.extend({}),z.Rectangle=z.Polygon.extend({_initMarkers:function(){var t=this._map,e=this._findCorners();this._markerGroup&&this._markerGroup.clearLayers(),this._markerGroup=new L.LayerGroup,this._markerGroup._pmTempLayer=!0,t.addLayer(this._markerGroup),this._markers=[],this._markers[0]=e.map(this._createMarker,this);var r=function(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){if(Symbol.iterator in Object(t)||"[object Arguments]"===Object.prototype.toString.call(t)){var r=[],n=!0,i=!1,o=void 0;try{for(var a,s=t[Symbol.iterator]();!(n=(a=s.next()).done)&&(r.push(a.value),!e||r.length!==e);n=!0);}catch(t){i=!0,o=t}finally{try{n||null==s.return||s.return()}finally{if(i)throw o}}return r}}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}(this._markers,1);this._cornerMarkers=r[0],this.options.snappable&&this._initSnappableMarkers()},_createMarker:function(t,e){var r=new L.Marker(t,{draggable:!0,icon:L.divIcon({className:"marker-icon"})});return r._origLatLng=t,r._index=e,r._pmTempLayer=!0,r.on("dragstart",this._onMarkerDragStart,this),r.on("drag",this._onMarkerDrag,this),r.on("dragend",this._onMarkerDragEnd,this),r.on("pm:snap",this._adjustRectangleForMarkerSnap,this),this.options.preventMarkerRemoval||r.on("contextmenu",this._removeMarker,this),this._markerGroup.addLayer(r),r},_removeMarker:function(){return null},_onMarkerDragStart:function(t){var e=t.target,r=this._findCorners();e._oppositeCornerLatLng=r[(e._index+2)%4],e._snapped=!1,this._layer.fire("pm:markerdragstart",{markerEvent:t})},_onMarkerDrag:function(t){var e=t.target;void 0!==e._index&&(e._snapped||this._adjustRectangleForMarkerMove(e))},_onMarkerDragEnd:function(t){var e=this._findCorners();this._adjustAllMarkers(e),this._cornerMarkers.forEach((function(t){delete t._oppositeCornerLatLng})),this._layer.setLatLngs(e),this._layer.fire("pm:markerdragend",{markerEvent:t}),this._fireEdit()},_adjustRectangleForMarkerMove:function(t){L.extend(t._origLatLng,t._latlng);var e=t.getLatLng();this._layer.setBounds(L.latLngBounds(e,t._oppositeCornerLatLng)),this._adjustAdjacentMarkers(t),this._layer.redraw()},_adjustRectangleForMarkerSnap:function(t){if(this.options.snappable){var e=t.target;this._adjustRectangleForMarkerMove(e)}},_adjustAllMarkers:function(t){t.length&&4===t.length?this._cornerMarkers.forEach((function(e,r){e.setLatLng(t[r])})):console.error("_adjustAllMarkers() requires an array of EXACTLY 4 LatLng coordinates")},_adjustAdjacentMarkers:function(t){if(t&&t.getLatLng&&t._oppositeCornerLatLng){var e=t.getLatLng(),r=t._oppositeCornerLatLng,n=[];this._findCorners().forEach((function(t){t.equals(e)||t.equals(r)||n.push(t)}));var i=0;2===n.length&&this._cornerMarkers.forEach((function(t){var o=t.getLatLng();o.equals(e)||o.equals(r)||(t.setLatLng(n[i]),i+=1)}))}else console.error("_adjustAdjacentMarkers() requires a valid Marker object")},_findCorners:function(){var t=this._layer.getBounds();return[t.getNorthWest(),t.getNorthEast(),t.getSouthEast(),t.getSouthWest()]}}),z.Circle=z.extend({initialize:function(t){this._layer=t,this._enabled=!1},toggleEdit:function(t){this.enabled()?this.disable():this.enable(t)},enabled:function(){return this._enabled},enable:function(t){var e=this;L.Util.setOptions(this,t),this._map=this._layer._map,this.enabled()||this.disable(),this._enabled=!0,this._initMarkers(),this._layer.on("remove",(function(t){e.disable(t.target)}))},disable:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:this._layer;if(!this.enabled())return!1;if(t.pm._dragging)return!1;t.pm._enabled=!1,t.pm._helperLayers.clearLayers(),t.off("mousedown"),t.off("mouseup");var e=t._path?t._path:this._layer._renderer._container;return L.DomUtil.removeClass(e,"leaflet-pm-draggable"),this._layerEdited&&this._layer.fire("pm:update",{}),!(this._layerEdited=!1)},_initMarkers:function(){var t=this._map;this._helperLayers&&this._helperLayers.clearLayers(),this._helperLayers=new L.LayerGroup,this._helperLayers._pmTempLayer=!0,this._helperLayers.addTo(t);var e=this._layer.getLatLng(),r=this._layer._radius,n=this._getLatLngOnCircle(e,r);this._centerMarker=this._createCenterMarker(e),this._outerMarker=this._createOuterMarker(n),this._markers=[this._centerMarker,this._outerMarker],this._createHintLine(this._centerMarker,this._outerMarker),this.options.snappable&&this._initSnappableMarkers()},_getLatLngOnCircle:function(t,e){var r=this._map.project(t),n=L.point(r.x+e,r.y);return this._map.unproject(n)},_resizeCircle:function(){this._syncHintLine(),this._syncCircleRadius()},_moveCircle:function(t){var e=t.latlng;this._layer.setLatLng(e);var r=this._layer._radius,n=this._getLatLngOnCircle(e,r);this._outerMarker.setLatLng(n),this._syncHintLine(),this._layer.fire("pm:centerplaced",{layer:this._layer,latlng:e})},_onMarkerDragStart:function(t){this._layer.fire("pm:markerdragstart",{markerEvent:t})},_onMarkerDragEnd:function(t){this._fireEdit(),this._layer.fire("pm:markerdragend",{markerEvent:t})},_syncCircleRadius:function(){var t=this._centerMarker.getLatLng(),e=this._outerMarker.getLatLng(),r=t.distanceTo(e);this._layer.setRadius(r)},_syncHintLine:function(){var t=this._centerMarker.getLatLng(),e=this._outerMarker.getLatLng();this._hintline.setLatLngs([t,e])},_createHintLine:function(t,e){var r=t.getLatLng(),n=e.getLatLng();this._hintline=L.polyline([r,n],this.options.hintlineStyle),this._hintline._pmTempLayer=!0,this._helperLayers.addLayer(this._hintline)},_createCenterMarker:function(t){var e=this._createMarker(t);return L.DomUtil.addClass(e._icon,"leaflet-pm-draggable"),e.on("drag",this._moveCircle,this),e},_createOuterMarker:function(t){var e=this._createMarker(t);return e.on("drag",this._resizeCircle,this),e},_createMarker:function(t){var e=new L.Marker(t,{draggable:!0,icon:L.divIcon({className:"marker-icon"})});return e._origLatLng=t,e._pmTempLayer=!0,e.on("dragstart",this._onMarkerDragStart,this),e.on("dragend",this._onMarkerDragEnd,this),this._helperLayers.addLayer(e),e},_fireEdit:function(){this._layer.fire("pm:edit"),this._layerEdited=!0}}),z.CircleMarker=z.extend({initialize:function(t){this._layer=t,this._enabled=!1},toggleEdit:function(t){this.enabled()?this.disable():this.enable(t)},enabled:function(){return this._enabled},enable:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{draggable:!0,snappable:!0};L.Util.setOptions(this,t),this._map=this._layer._map,this._map&&(this.enabled()||this.disable(),this._enabled=!0,this.options.preventMarkerRemoval||this._layer.on("contextmenu",this._removeMarker,this),this.options.draggable&&this.enableLayerDrag(),this.options.snappable&&this._initSnappableMarkers(),this._layer.on("pm:dragend",this._onMarkerDragEnd,this))},disable:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:this._layer;if(!this.enabled())return!1;if(t.pm._dragging)return!1;if(t.pm._enabled=!1,t._path){var e=t._path;L.DomUtil.removeClass(e,"leaflet-pm-draggable")}return this._layerEdited&&this._layer.fire("pm:update",{}),!(this._layerEdited=!1)},_moveMarker:function(t){var e=t.latlng;this._layer.setLatLng(e).redraw()},_removeMarker:function(){this._layer.fire("pm:remove"),this._layer.remove()},_fireEdit:function(){this._layer.fire("pm:edit"),this._layerEdited=!0},_onMarkerDragEnd:function(t){this._layer.fire("pm:markerdragend",{markerEvent:t}),this._fireEdit()},_initSnappableMarkers:function(){var t=this._layer;this.options.snapDistance=this.options.snapDistance||30,t.off("pm:drag",this._handleSnapping,this),t.on("pm:drag",this._handleSnapping,this),t.off("pm:dragend",this._cleanupSnapping,this),t.on("pm:dragend",this._cleanupSnapping,this),t.off("pm:dragstart",this._unsnap,this),t.on("pm:dragstart",this._unsnap,this)}}),r(133),r(134),L.PM=L.PM||{version:n.a,Map:_,Toolbar:w,Draw:S,Edit:z,activeLang:"en",initialize:function(t){this.addInitHooks(t)},addInitHooks:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};L.Map.addInitHook((function(){this.pm=void 0,t.optIn?!1===this.options.pmIgnore&&(this.pm=new L.PM.Map(this)):this.options.pmIgnore||(this.pm=new L.PM.Map(this))})),L.LayerGroup.addInitHook((function(){this.pm=new L.PM.Edit.LayerGroup(this)})),L.Marker.addInitHook((function(){this.pm=void 0,t.optIn?!1===this.options.pmIgnore&&(this.pm=new L.PM.Edit.Marker(this)):this.options.pmIgnore||(this.pm=new L.PM.Edit.Marker(this))})),L.CircleMarker.addInitHook((function(){this.pm=void 0,t.optIn?!1===this.options.pmIgnore&&(this.pm=new L.PM.Edit.CircleMarker(this)):this.options.pmIgnore||(this.pm=new L.PM.Edit.CircleMarker(this))})),L.Polyline.addInitHook((function(){this.pm=void 0,t.optIn?!1===this.options.pmIgnore&&(this.pm=new L.PM.Edit.Line(this)):this.options.pmIgnore||(this.pm=new L.PM.Edit.Line(this))})),L.Polygon.addInitHook((function(){this.pm=void 0,t.optIn?!1===this.options.pmIgnore&&(this.pm=new L.PM.Edit.Polygon(this)):this.options.pmIgnore||(this.pm=new L.PM.Edit.Polygon(this))})),L.Rectangle.addInitHook((function(){this.pm=void 0,t.optIn?!1===this.options.pmIgnore&&(this.pm=new L.PM.Edit.Rectangle(this)):this.options.pmIgnore||(this.pm=new L.PM.Edit.Rectangle(this))})),L.Circle.addInitHook((function(){this.pm=void 0,t.optIn?!1===this.options.pmIgnore&&(this.pm=new L.PM.Edit.Circle(this)):this.options.pmIgnore||(this.pm=new L.PM.Edit.Circle(this))}))}},L.PM.initialize()}]);
// Creates a map view



function NavigationMapView(map_object, callback) {
  var self = this;
  self.features = {};
  self.map_object = map_object;
  self.id = map_object.dataset.id;
  self.image_path = map_object.dataset.image;
  self.blueprint = map_object.dataset.blueprint ? JSON.parse(map_object.dataset.blueprint) : {};
  self.image = new Image();
  self.image.onload = function() {
    self.createMap();
    if(typeof callback === "function") {
      callback(self);
    } else {
      if(self.blueprint) {
        self.createAreas();
      }
    }
  };
  self.image.src = self.image_path;
  this.clickAreaCallback = function () {};
  this.setLayerPropertiesCallback = function () {};
}

NavigationMapView.prototype.createMap = function() {
  var bounds = [[0,0], [this.image.height,this.image.width]];

  this.map = L.map(this.map_object, {
      minZoom: -1,
      maxZoom: 2,
      crs: L.CRS.Simple,
      noWrap: true,
      zoomSnap: 0,
      // zoomDelta: 0.1,
      maxBounds: [[0,0], [this.image.height,this.image.width]],
      center: [this.image.height/2, this.image.width/2],
      zoom: -1,
      scrollWheelZoom: false
  });

  L.imageOverlay(this.image.src, bounds).addTo(this.map);
  this.fitBounds();
};

NavigationMapView.prototype.fitBounds = function() {
  var image_ratio = this.image.height / this.image.width;
  var map_ratio = this.map_object.offsetHeight / this.map_object.offsetWidth;

  if(image_ratio > map_ratio) {
    this.map.fitBounds([[0,0], [0,this.image.width]]);
  }
  else {
    this.map.fitBounds([[0,0], [this.image.height,0]]);
  }
  this.map.setView([this.image.height/2, this.image.width/2]);
};

NavigationMapView.prototype.createAreas = function() {
  var self = this;
  self.forEachBlueprint(function(id, geoarea) {
    new L.GeoJSON(geoarea, {
      onEachFeature: function(feature, layer) {
        layer._leaflet_id = id;
        self.setLayerProperties(layer, geoarea);
        self.attachEditorEvents(layer);
      }
    }).addTo(self.map);
  });
};

NavigationMapView.prototype.setLayerProperties = function (layer, area) {
  var props = area.properties;
  if(props) {
    if(props.color) {
      layer.setStyle({fillColor: props.color, color: props.color});
    }
    this.setLayerPropertiesCallback(layer, props);
  }
};

NavigationMapView.prototype.attachEditorEvents = function (layer) {
  var self = this;

  layer.on('mouseover', function(e) {
    e.target.getElement().classList.add('selected')
  });

  layer.on('mouseout', function(e) {
    e.target.getElement().classList.remove('selected')
  });

  layer.on('click', function(e) {
    self.clickAreaCallback(e.target, self);
  });
};

// register callback to handle area clicks
NavigationMapView.prototype.onClickArea = function(callback) {
  this.clickAreaCallback = callback;
};

NavigationMapView.prototype.onSetLayerProperties = function(callback) {
  this.setLayerPropertiesCallback = callback;
};

NavigationMapView.prototype.forEachBlueprint = function (callback) {
  for (var id in this.blueprint) {
    var geoarea = this.blueprint[id];
    // avoid non-polygons for the moment
    if(!geoarea.geometry || geoarea.geometry.type !== 'Polygon') continue;
    callback(id, geoarea);
  }
};

NavigationMapView.prototype.reload = function () {
  if(this.map) {
    this.map.invalidateSize(true);
    this.fitBounds();
  }
};
// Creates a map


function NavigationMapEditor(map_object, table_object) {
  var self = this;
  // Call constructor of superclass to initialize superclass-derived members.
  NavigationMapView.call(self, map_object, function() {
    self.createControls();
    if(self.blueprint) {
      self.createAreas();
    }
  });
  self.table_object = table_object;
  this.createAreaCallback = function () {};
  this.editAreaCallback = function () {};
  this.removeAreaCallback = function () {};
}

// NavigationMapEditor derives from NavigationMapView
NavigationMapEditor.prototype = Object.create(NavigationMapView.prototype);
NavigationMapEditor.prototype.constructor = NavigationMapEditor;

NavigationMapEditor.prototype.createControls = function() {
  var self = this;
  self.map.pm.addControls({
    position: 'topleft',
    drawCircle: false,
    drawMarker: false,
    drawCircleMarker: false,
    drawPolyline: false,
    cutPolygon: false
  });

  self.map.on('pm:create', function(e) {
    var geojson = e.layer.toGeoJSON();
    self.blueprint[e.layer._leaflet_id] = geojson;
    self.attachEditorEvents(e.layer);
    self.createAreaCallback(e.layer._leaflet_id, e.layer, self);
  });

  self.map.on('pm:remove', function(e) {
    delete self.blueprint[e.layer._leaflet_id];
    self.removeAreaCallback(e.layer._leaflet_id, e.layer, self);
  });
};

NavigationMapEditor.prototype.editing = function() {
  var pm = this.map.pm;
  return pm.globalRemovalEnabled() || pm.globalDragModeEnabled() || pm.globalEditEnabled();
};

// register callback to handle area edits,removals and creations
NavigationMapView.prototype.onCreateArea = function(callback) {
  this.createAreaCallback = callback;
};
NavigationMapView.prototype.onEditArea = function(callback) {
  this.editAreaCallback = callback;
};
NavigationMapView.prototype.onRemoveArea = function(callback) {
  this.removeCreateCallback = callback;
};

NavigationMapEditor.prototype.attachEditorEvents = function (layer) {
  var self = this;

  layer.on('mouseover', function(e) {
    e.target.getElement().classList.add('selected')
  });

  layer.on('mouseout', function(e) {
    e.target.getElement().classList.remove('selected')
  });

  layer.on('pm:edit', function(e) {
    self.blueprint[e.target._leaflet_id] = e.target.toGeoJSON();
    self.editAreaCallback(e.target._leaflet_id, e.target, self);
  });

  layer.on('click', function(e) {
    if(!self.editing()) {
      self.clickAreaCallback(e.target._leaflet_id, e.target, self);
    }
  });
};

NavigationMapEditor.prototype.getBlueprint = function () {
  return this.blueprint;
};
// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.




$(function() {

  var $maps = $('.navigation_maps.admin .map');
  var $progress = $('.navigation_maps.admin .progress');
  var $bar = $('.navigation_maps.admin .progress-meter');
  var $loading = $('.navigation_maps.admin .loading');
  var $callout = $('.navigation_maps.admin .callout');
  var $modal = $('#mapEditModal');
  var $form = $('form');
  var $tabs = $('#navigation_maps-tabs');
  var $accordion = $('.navigation_maps.admin .accordion');
  var editors = {};
  var new_areas = {};

  $maps.each(function() {
    var id = $(this).data('id');
    var table = document.getElementById("navigation_maps-table-" + id);
    editors[id] = new NavigationMapEditor(this, table);
    editors[id].onCreateArea(function(area_id) {
      new_areas[area_id] = true;
    });

    editors[id].onClickArea(function(area_id, area) {
      $modal.find('.modal-content').html('');
      $modal.addClass('loading').foundation('open');
      $callout.hide();
      $callout.removeClass('alert success');
      // "new" form insted of editing
      var rel = new_areas[area_id] ? 'new' : area_id;
      $modal.find('.modal-content').load(`/admin/navigation_maps/blueprints/${id}/areas/${rel}`, function() {
        var $input1 = $modal.find('input[name="blueprint_area[area_id]"]');
        var $input2 = $modal.find('input[name="blueprint_area[area_type]"]');
        var $input3 = $modal.find('input[name="blueprint_area[area]"]');
        var a = area.toGeoJSON();
        $modal.removeClass('loading');
        if($input1.length) $input1.val(area_id);
        if($input2.length) $input2.val(a.type);
        if($input3.length) $input3.val(JSON.stringify(a));
        $modal.find('ul[data-tabs=true]').each(function() {
          new Foundation.Tabs($(this));
        });
      });
    });
  });

  // Rails AJAX events
  document.body.addEventListener('ajax:error', function(responseText) {
    $callout.contents('p').html(responseText.detail[0].message + ": <strong>" + responseText.detail[0].error + "</strong>");
    $callout.addClass('alert');
  });

  document.body.addEventListener('ajax:success', function(responseText) {
    if(new_areas[responseText.detail[0].area]) {
      delete new_areas[responseText.detail[0].area]
    }
    var blueprint_id = responseText.detail[0].blueprint_id;
    var area_id = responseText.detail[0].area_id;
    var area = responseText.detail[0].area;
    editors[blueprint_id].setLayerProperties(editors[blueprint_id].map._layers[area_id], area);
    editors[blueprint_id].blueprint[area_id] = area;
    $callout.contents('p').html(responseText.detail[0].message);
    $callout.addClass('success');
  });

  document.body.addEventListener('ajax:complete', function() {
    $callout.show();
    $modal.foundation('close');
  })

  $tabs.on('change.zf.tabs', function(e, $tab, $content) {
    var id = $content.find('.map').data('id');
    if(id) {
      editors[id].reload();
    }
  });

  $accordion.on('down.zf.accordion', function(e, $accordion) {
    var id = $accordion.find('.map').data('id');
    if(id) {
      editors[id].reload();
    }
  });

  // If a new item si going to be created o the image is changed a reload is needed
  var needsReload = function() {
    var reload = false;
    if($form.find('#map-new input:checked').length) return true;
    if($form.find('.delete-tab input[type=checkbox]:checked').length) return true;

    $form.find('input[type=file],input[tabs_id=blueprints___title]').each(function() {
      if($(this).val()) {
        reload = true;
        return false;
      }
    });
    return reload;
  };

  $form.ajaxForm({
    url: $form.find('[name=action]').val(),
    beforeSerialize: function() {
      Object.keys(editors).forEach(function(key) {
        var editor = editors[key];
        $(`#blueprints_${editor.id}_blueprint`).val(JSON.stringify(editor.getBlueprint()));
      });
    },
    beforeSend: function() {
        var percentVal = '0%';
        $bar.width(percentVal).html(percentVal);
        $progress.show();
        $callout.hide();
        $callout.removeClass('alert success');
        $loading.show();
    },
    uploadProgress: function(event, position, total, percentComplete) {
        var percentVal = percentComplete + '%';
        $bar.width(percentVal).html(percentVal);
    },
    success: function(responseText) {
        $callout.show();
        $progress.hide();
        $callout.contents('p').html(responseText);
        $callout.addClass('success');
        $loading.hide();
        if(needsReload()) {
          $loading.show();
          location.reload();
        }
    },
    error: function(xhr) {
      $loading.hide();
      $callout.show();
      $callout.contents('p').html(xhr.responseText);
      $callout.addClass('alert');
    }
  });
});

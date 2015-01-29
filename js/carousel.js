/*
* carousel.js
* Dependencies: jquery.barousel.js
*/
/*jslint browser : true, continue : true,
devel : true, indent : 2, maxerr : 50,
newcap : true, nomen : true, plusplus : true,
regexp : true, sloppy : true, vars : false,
white : true
*/
/*global $, carousel */
var carousel = (function () {
    'use strict';
    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var
    configMap = {
        main_html: String()
        + '<div class="barousel_image"></div>'
        + '<div class="barousel_content"><div class="default"><h4>Loading...</h4><p></p></div></div>'
        + '<div class="barousel_nav"></div>',
        settable_map: {
            fake: true,
            listGuid: true,
            viewGuid: true,
            url: true
        },
        fake: false,
        listGuid: "",
        viewGuid: "",
        url: ""
    },
    templateMap = {
        no_content: '<div class="default"><h4>Sorry, no content :(</h4><p>To upload content, please visit the announcement list and upload a new item.</p></div></div>',
        error: '<div class="default"><h4>Error loading content :(</h4><p></p></div></div>'
    },
    stateMap = {
        $container: undefined
    },
    jqueryMap = {},
     setJqueryMap, getData, configModule,setConfigMap, initModule, printError, processResult, populateCarousel, stripHtml;
    //----------------- END MODULE SCOPE VARIABLES ---------------
    //-------------------- BEGIN UTILITY METHODS -----------------
    stripHtml = function (html) {
        var temp = document.createElement('DIV');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || "";

    };


    //--------------------- END UTILITY METHODS ------------------
    //--------------------- BEGIN DOM METHODS --------------------
    // Begin DOM method /setJqueryMap/
    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container,
            $imageContainer: $container.find('.barousel_image'),
            $contentContainer: $container.find('.barousel_content'),
            $nav: $container.find('.barousel_nav')
          
        };
    };
    // End DOM method /setJqueryMap/

    // Begin DOM method /getData/
    getData = function () {
        // Create the SOAP request
        var soapEnv =
            "<soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/'> \
                <soapenv:Body> \
                        <GetListItems xmlns='http://schemas.microsoft.com/sharepoint/soap/'> \
                        <listName>" + configMap.listGuid + "</listName> \
                        <viewName>" + configMap.viewGuid + "</viewName> \
                    </GetListItems> \
                </soapenv:Body> \
            </soapenv:Envelope>";

        $.ajax({
            url: configMap.url,
            type: "POST",
            dataType: "xml",
            data: soapEnv,
            error: printError,
            complete: processResult,
            contentType: "text/xml; charset=\"utf-8\""
        });
    }
    // End DOM method /getData/

    function printError(XMLHttpRequest, textStatus, errorThrown) {
        console.log("There was an error: " + errorThrown + " " + textStatus);
        console.log(XMLHttpRequest.responseText);
        $contentContainer = jqueryMap.$contentContainer;
        $contentContainer.empty();
        $contentContainer.html(templateMap.error);
    }


    processResult = function (xData, status) {
        if (status == "error") {
            return false;
        }
        var items = [],
            jsonCols = {
                title: "ows_Title",
                body: "ows_Body",
                imageSrc: "ows_Image",
                linkSrc: "ows_Link",
                linkText: "ows_LinkText",
                expires: "ows_Expires",
                date: "ows_Date"
            };
       

        $(xData.responseXML).find("z\\:row").each(function () {
            var $this = $(this),
                key,
                obj = {};
            for (key in jsonCols) {
                obj[key] = typeof $this.attr(jsonCols[key]) !== "undefined" ? $this.attr(jsonCols[key]) : "";
            }
            items.push(obj);
        });
        populateCarousel(items, jsonCols);
        //initiate barousel plugin
        stateMap.$container.barousel({
            navType: 2,
            fadeIn: 0,
            slideDuration: 8000 //miliseconds
        });
    };

     populateCarousel = function (items) {
         var $imageContainer = jqueryMap.$imageContainer,
            $contentContainer =  jqueryMap.$contentContainer,
            contentHtml = '<div class="content"><h4 class="header"></h4><span class="date"></span><p class="body"></p></div>',
            i, $img, $content, $body, $header, imgSrc, imgAlt;

        if (items.length == 0) {
            $contentContainer.empty();
            $(templateMap.no_content).appendTo($contentContainer);
            return false;
        }

        $contentContainer.empty();

         for (i = 0; i < items.length; i++) {
             imgSrc = items[i].imageSrc.split(',')[0];
             imgAlt = items[i].imageSrc.split(',')[1];
             $img = $('<img>');
             $img.attr('src', imgSrc);
             $img.attr('alt', imgAlt);
             $img.appendTo($imageContainer);



             $content = $(contentHtml);
             $header = $content.find('.header');
             $date = $content.find('.date');
             $body = $content.find('.body');

             $header.text(items[i].title);
             $date.text(items[i].date.toString().substring(0, 10));
             var $tempBody = $(items[i].body);
             $body.html($tempBody.html());

             $('<br/><a href="' + items[i].linkSrc.split(',')[0] + '" target="_top" >' + items[i].linkText + '</a>').appendTo($body);

             $content.appendTo($contentContainer);

             if (i == 0) {
                 $img.addClass('default');
                 $content.addClass('default');
             } 
         }

     };

    

    // Begin Public method /setConfigMap/
    // Purpose: Common code to set configs in feature modules
    // Arguments:
    // * input_map - map of key-values to set in config
    // * settable_map - map of allowable keys to set
    // * config_map - map to apply settings to
    // Returns: true
    // Throws : Exception if input key not allowed
    //
     setConfigMap = function (arg_map) {
         var
         input_map = arg_map.input_map,
         settable_map = arg_map.settable_map,
         config_map = arg_map.config_map,
         key_name, error;
         for (key_name in input_map) {
             if (input_map.hasOwnProperty(key_name)) {
                 if (settable_map.hasOwnProperty(key_name)) {
                     config_map[key_name] = input_map[key_name];
                 }
                 else {
                     error = makeError('Bad Input',
                     'Setting config key |' + key_name + '| is not supported'
                     );
                     throw error;
                 }
             }
         }
     };
    // End Public method /setConfigMap/

    //--------------------- END DOM METHODS ----------------------
    //------------------- BEGIN EVENT HANDLERS -------------------
   
    //-------------------- END EVENT HANDLERS --------------------
    //---------------------- BEGIN CALLBACKS ---------------------
   
    //----------------------- END CALLBACKS ----------------------
    //------------------- BEGIN PUBLIC METHODS -------------------
    // Begin public method /configModule/
    // Purpose : Adjust configuration of allowed keys
    // Arguments : A map of settable keys and values
    // * color_name - color to use
    // Settings :
    // * configMap.settable_map declares allowed keys
    // Returns : true
    // Throws : none
    //
    configModule = function (input_map) {
        setConfigMap({
            input_map: input_map,
            settable_map: configMap.settable_map,
            config_map: configMap
        });
        return true;
    };
    // End public method /configModule/
    // Begin Public method /initModule/
    // Example : spa.shell.initModule( $('#app_div_id') );
    // Purpose :
    // Directs the Shell to offer its capability to the user
    // Arguments :
    // * $container (example: $('#app_div_id')).
    // A jQuery collection that should represent
    // a single DOM container
    // Action :
    // Populates $container with the shell of the UI
    // and then configures and initializes feature modules.
    // The Shell is also responsible for browser-wide issues
    // such as URI anchor and cookie management.
    // Returns : none
    // Throws : none
    //
    initModule = function (options) {
        // load HTML and map jQuery collections
        $container = options.container;
        configModule(options.config);
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();
        //add required class for barousel plugin
        $container.addClass('barousel');
        getData();
           

    };

    
    
    return {
        initModule: initModule,
        configModule: configModule
    };
    //------------------- END PUBLIC METHODS ---------------------
})();
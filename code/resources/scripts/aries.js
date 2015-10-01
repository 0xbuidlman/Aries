// aries.js
// @IdeasNeverCease
// ========================================================

/* jshint undef: true, unused: true */
/* global process, $, require, emitter, document, include, setTimeout, NProgress, URI */
/* global navigator, window */



console.log(
  process.platform + " " + process.arch,
  "\nPID: " + process.pid
);



var
  tabInit = "",
  iframeInit = ""
;



// Detect if offline or online (pretty cool)
// var stat = document.querySelector(".status");
function update() {
  // stat.innerHTML = navigator.onLine ? "online": "offline";
  console.log(navigator.onLine ? "online": "offline");
}

window.addEventListener("offline", update);
window.addEventListener("online", update);

update();



$(function () {

  // Initialize Node Webkit
  var
    nw = {
      gui: require("nw.gui"),
      win: require("nw.gui").Window.get(),
      platform: require("os").platform,
      spawn: require("child_process").spawn,
      exec: require("child_process").exec,
      fs: require("fs"),
      path: require("path")
    },
    currWinMode,
    isMaximizationEvent = false
  ;



  // Build initial tab
  tabInit +=
    "<button class='tab active' data-tab='' data-page='pages/start.html'>" +
      "<img class='tab-favicon' type='image/x-icon' src='resources/images/favicon-default.png'>" +
      "<span class='tab-close'></span>" +
      "<span class='tab-title'></span>" +
    "</button>"
  ;

  // iframeInit += "sandbox='allow-same-origin allow-scripts allow-forms'";
  // need to make user agent dynamic
  // iframeInit += "nwUserAgent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Aries/0.5-alpha' ";

  // Build initial iframe
  iframeInit +=
    "<iframe class='tabs-pane active' seamless='true' nwdisable nwfaketop id=''></iframe>"
  ;

  // Bring in menu bar
  include("resources/scripts/menubar.js");



  // Minimize Aries
  $(".app-minimize").on("click", function () {
    nw.win.on("minimize", function () {
      currWinMode = "minimized";
    });

    nw.win.minimize();
  });



  // Restore Aries
  nw.win.on("restore", function () {
    currWinMode = "normal";

    // Memory Leak // Might be fixed now...
    process.setMaxListeners(0);
    emitter.setMaxListeners(0);
  });



  // Un/Maximize Aries
  $(".app-maximize").on("click", function () {
    nw.win.on("maximize", function () {
      isMaximizationEvent = true;
      currWinMode = "maximized";
    });

    nw.win.on("unmaximize", function () {
      currWinMode = "normal";
      // restoreWindowState();
    });

    nw.win.maximize();
  });



  // Close Aries
  $(".app-close").on("click", function () {
    nw.win.on("close", function () {
      // saveWindowState();
      this.close(true);
    });

    nw.win.close();
  });



  // Set URL/status bar width
  $("#url-bar").css("width", nw.win.window.innerWidth - 190 + "px");
  $("#status-bar").css("width", nw.win.window.innerWidth - 190 + "px");



  /*
  // Set showcase width and height
  // $("#aries-showcase, iframe").css({
  $("#aries-showcase").css({
    "width": nw.win.window.innerWidth - 1 + "px",
    "height": nw.win.window.innerHeight - 33 + "px" // minus URL bar height + 1px
  });
  */



  // Prevent popups from occurring
  nw.win.on("new-win-policy", function (frame, url, policy) {
    policy.ignore();

    // Memory Leak // Might be fixed now...
    process.setMaxListeners(0);
    emitter.setMaxListeners(0);
  });



  // Recalculate sizing of browser elements when scaling Aries
  // TODO: make this better
  nw.win.on("resize", function () {
    // Set URL bar width
    $("#url-bar").css("width", nw.win.window.innerWidth - 190 + "px");

    /*
    // Set showcase width and height
    // $("#aries-showcase, iframe").css({
    $("#aries-showcase").css({
      "width": nw.win.window.innerWidth - 1 + "px",
      "height": nw.win.window.innerHeight - 33 + "px"
    });
    */

    // Memory Leak // Uncommenting "emitter" results in error, why?!
    process.setMaxListeners(0);
    // emitter.setMaxListeners(0);
  });



  // Things to do before Aries starts
  $("#tab-wrapper").append(tabInit);
  $("#aries-showcase").append(iframeInit);

  pageLoad();

  // Set the first tab and iframe to actually have an ID
  $(".tab.active").attr("data-tab", "#tab1");
  $("iframe.active").attr("id", "tab1");

  /*
  // Reload tabs and windows of previous session
  $("#tab-wrapper .tab").each(function () {
    var
      dataTab = $(this).attr("data-tab"),
      dataPage = $(this).attr("data-page")
    ;

    // Set window URL via associated tab [data-page]
    $("#aries-showcase iframe" + dataTab).attr("src", dataPage);

    // Grab page title and attach to associated tab
    setTimeout(function () {

      var currentTitle = $("#aries-showcase iframe" + dataTab).contents().find("title").html();

      $("#aries-showcase iframe").bind("load", function () {
        $(".tab[data-tab=" + dataTab + "] .tab-title").text(currentTitle);
      });

      console.log("#3 — Tab Title: " + currentTitle);

    }, 150);

    console.log("#1 — Tab URL: " + dataPage);
    console.log("#2 — Tab ID: " + dataTab);
  });
  */

  tabHover();

  // Let's get this shit started!
  nw.win.maximize();

  setTimeout(function () {
    $("#url-bar").val("").focus();
    nw.win.show();
  }, 100);

});



$(document).on("click", ".tab-title", function () {

  var tabID = $(this).parent().attr("data-tab");
  // var tabID = $(this).attr("data-tab");
  var gotIT = $("iframe" + tabID).attr("src");
  var title = $("iframe" + tabID).contents().find("title").html();

  // Remove active states for other tabs/windows
  $("iframe").removeClass("active");
  $("#tab-wrapper button").removeClass("active");

  // Add active states for selected tab/window
  $("iframe" + tabID).addClass("active");
  $(this).parent().addClass("active");

  // Populate title/address bar, tab title, and
  // tab icon with appropriate information
  $("#url-bar").val(gotIT);
  $(".tab-title", this).text(title);
  $("#aries-titlebar h1").text(title);
  $(".tab-favicon", this).attr("src", getFavicon);

  // Don't show anything in address bar if on start page,
  // but put it in focus
  if (gotIT === "pages/start.html") {
    $("#url-bar").val("").focus();
  }

  console.log(tabID);
  console.log(gotIT);

});

$(document).on("click", ".tab-close", function () {

  // TODO
  // Make this a function so I can use this for keyboard shortcuts
  var tabID = $(this).parent().attr("data-tab");
  var gotIT = $("iframe" + tabID);

  var
  tab = $(this).closest("#tab-wrapper").find(".tab"),
      win = $(gotIT).closest("#aries-showcase").find("iframe"),
      tabCount = tab.length,
      winCount = win.length;

  if ((tabCount == 1) && (winCount == 1)) { // if there is only one window left

    console.log("This is the last tab and window.");

    $(this).parent(".tab").addClass("active");
    $(gotIT).attr("src", "pages/start.html");
    $(gotIT).addClass("active");

  } else if ((tabCount > 1) && (winCount > 1)) { // if there is more than one window

    if ($(this).parent().hasClass("active") && $(gotIT).hasClass("active")) {

      var prevTab = $(this).parent(".tab").prev(".tab");
      var nextTab = $(this).parent(".tab").next(".tab");

      if (prevTab.length) {
        $(this).parent(".tab").prev(".tab").addClass("active");
      } else if (nextTab.length) {
        $(this).parent(".tab").next(".tab").addClass("active");
      }

      var prevWin = $(gotIT).prev("iframe");
      var nextWin = $(gotIT).next("iframe");

      if (prevWin.length) {
        $(gotIT).prev("iframe").addClass("active");
      } else if (nextWin.length) {
        $(gotIT).next("iframe").addClass("active");
      }

    }

    setTimeout(function () {
      var location = $("iframe.active").attr("src");
      $("#url-bar").val(location);
    }, 10);

    $(this).parent(".tab").remove();
    $(gotIT).remove();

  } else if ((tabCount < 1) && (winCount < 1)) { // just create new tab and window

    console.log("Create new tab and window");

    $("#tab-wrapper").append(tabInit);
    $("#aries-showcase").append(iframeInit);

    if ($("#url-bar").val() == "pages/start.html") {
      $("#url-bar").val("").focus();
    } else {
      $("#url-bar").val("").focus();
    }

  }

});

// TODO
// The Back and Forward buttons need to work for every tab/window

// Back Button
$(document).on("click", ".app-go-back", function () {

  w = $(".tabs-pane.active")[0];
  w.contentWindow.history.go(-1);

  console.log("--- Went back");

});

// Forward Button
$(document).on("click", ".app-go-forth", function () {

  w = $(".tabs-pane.active")[0];
  w.contentWindow.history.go(1);

  console.log("--- Went forward");

});

$(document).on("click", ".app-settings", function (e) {

  e.preventDefault();
  e.stopPropagation();

  $("#bt-menu").toggleClass("bt-menu--is-open");

  $(document).one("click", function (e) {
    if ($("#bt-menu").has(e.target).length === 0) {
      $("#bt-menu").removeClass("bt-menu--is-open");
    }
  });

});



function tabHover() {

  $(".tab").each(function () {
    $(this).on("mouseenter", function () {
      $(".tab-favicon", this).hide();
      $(".tab-close", this).show();
    });

    $(this).on("mouseleave", function () {
      $(".tab-favicon", this).show();
      $(".tab-close", this).hide();
    });
  });

}

// Grab favicons for tabs
var getFavicon = function () {

  var favicon, tabID = $(".tab.active").attr("data-tab");
  var nodeList = $("iframe" + tabID).contents().find("link");
  // var nodeListII = $("iframe" + tabID).contents().find("meta");

  for (var i = 0; i < nodeList.length; i++) {
    // get any type of icon
    // meta property="og:image" content="http://images.apple.com/home/images/og.jpg"
    if ((nodeList[i].getAttribute("rel") == "icon") || (nodeList[i].getAttribute("rel") == "shortcut icon") || (nodeList[i].getAttribute("rel") == "apple-touch-icon")) {
      favicon = nodeList[i].href; // get absolute path
    } // else { favicon = "resources/images/favicon-default.png"; }

    /*
    if (nodeListII[i].getAttribute("property") == "og:image") {
      favicon = nodeListII[i].content;
    }
    */
  }

  return favicon;

};

function pageLoad() {

  NProgress.start();

  $("iframe.active").on("load", function () {

    console.log("Loaded iframe");

    // var currentTitle = $("#aries-showcase iframe" + dataTab).contents().find("title").html();

    var
      /*
      nw = {
        gui: require("nw.gui"), // Load native UI library
        win: require("nw.gui").Window.get(), // Get the current window
        platform: require("os").platform,
        spawn: require("child_process").spawn,
        exec: require("child_process").exec,
        fs: require("fs"),
        path: require("path")
      },
      // $frameBody = $(this).contents().find("body")
      // currentURL = $("#url-bar").val(baseURL),
      // iframe = $(this)[0],
      */
      iframe = $(this).contents(),
      $frameHead = $(this).contents().find("head"),
      m = document.createElement("meta"),
      baseURL = this.contentWindow.location.href,
      currentTitle = $(this).contents().find("title").html()
    ;

    m.httpEquiv = "content-security-policy";
    // m.content = "script-src 'self' 'unsafe-inline';";
    m.content = "script-src 'self' 'unsafe-inline' *.google.com platform.twitter.com https://facebook.com *.facebook.net *.skimresources.com *.ytimg.com;";
    $frameHead.prepend(m);

    // Inject menus and default styles
    // include("resources/scripts/browser.js");
    // include("resources/scripts/scroll/CustomScrollbar.js");



    ///
    /*
    blockers = [
      /platform.twitter.com\/widgets.js/,
      /twitter.com\/widgets\/tweet_button.html/,
      /linkedin.com\/analytics/,
      /platform.linkedin.com\/in.js/,
      /platform.linkedin.com\/js\/nonSecureAnonymousFramework/,
      /connect.facebook.net\/en_US\/all.js/,
      /facebook.com\/plugins\/like/,
      /plusone.google.com/,
      /googleapis.client__plusone.js/,
      /plusone.*png/,
      /sharethis.com/,
      /stumbleupon.com\/.*badge/,
      /cdn.stumble-upon.com/
    ]
    */

    /*
    nw.win.on("resize", function () {
      // Set iframe width and height
      $("iframe").css({
        "width": "100vw",
        "height": "100vh"
      });

      process.setMaxListeners(0);
    });
    */



    /*
    $("#tab-wrapper .tab").each(function () {
      var dataTab = $(this).attr("data-tab");
      var dataPage = $(this).attr("data-page");

      // Set window URL via associated tab [data-page]
      $("#aries-showcase iframe" + dataTab).attr("src", dataPage);
    });
    */



    $("#url-bar").val(baseURL);
    // $("button.active").attr("data-page", baseURL);
    $("button.active .tab-title").text(currentTitle);
    $("#aries-titlebar h1").text(currentTitle);
    $("button.active .tab-favicon").attr("src", getFavicon);

    /*
    var title = $("iframe" + tabID).contents().find("title").html();
    $(".tab-title", this).text(title);
    $("#aries-titlebar h1").text(title);
    */



    // Remove focus from URL bar
    // TODO: focus on first input field in iframe.
    //////// if none exist, focus on iframe.
    $(this).focus();

    // Start progress bar when clicking <a> inside window

    iframe.find("a").not("a[href*='#'], a[href*='%'], a[href*='javascript:;']").bind("click", function () {

      // Why do people create <a> with no hrefs? Annoying...
      if ($(this).attr("href").length === 0) { return false; }

      if ($(this).attr("target") === "_blank") {
        console.log("New tab from _blank");

        /*
        // Remove focus from other tabs and windows
        $(".tab, .tabs-pane").removeClass("active");

        $("#tab-wrapper").append(tabInit);
        $("#aries-showcase").append(iframeInit);

        $("#url-bar").val("").focus();

        var tabID = 0, windowID = 0;

        // Add a new tab
        $("#tab-wrapper .tab").each(function () {

          tabID++;
          $(this).attr("data-tab", "#tab" + tabID);

          var dataPage = $(this).attr("data-page");
          console.log(dataPage);

        });

        // Add a new window
        $("#aries-showcase iframe").each(function () {

          windowID++;
          $(this).attr("id", "tab" + windowID);
          // $(this).attr("src", dataPage);

        }).css({ "width": nw.win.window.innerWidth, "height": nw.win.window.innerHeight - 31 + "px" });

        $("iframe.active").each(function () {
          this.contentWindow.location.reload(true);
        });
        */

        /*
        // Reinitialize tabby to recognize new tab and window
        tabby.init();
        tabHover();
        */
      }

      if ($(this).attr("href").indexOf(".pdf") >-1) {

        console.log("This is a PDF: " + $(this).attr("href"));
        // _pagePDF();

        /*
        // Let's work on PDF support after 1.0 is out...
        $("iframe.active").attr("src", "resources/scripts/pdf/index.html");
        $("button.active").attr("data-page", "resources/scripts/pdf/index.html");
        */

        // $("iframe.active").attr("src", "resources/scripts/pdf/index.html?file=" + encodeURIComponent($(this).attr("href")));
        // $("button.active").attr("data-page", "resources/scripts/pdf/index.html?file=" + encodeURIComponent($(this).attr("href")));

        // aries://app.nw/resources/scripts/pdf/index.html?file=aries%3A%2F%2Fapp.nw%2Fresources%2Fscripts
        // %2Fpdf%2Fbuild%2Fgeneric%2Fweb%2Fcompressed.tracemonkey-pldi-09.pdf

        // set PDF src in viewer.js somehow...
        // location?

        setTimeout(function () {
          $("#url-bar").val("");
        }, 100);

      }

      // NProgress.start(); // Hmm, may not need this...

      $("button.active .tab-title").html(currentTitle);
      $("button.active .tab-favicon").attr("src", getFavicon);

      var location = $(this)[0].href;
      $("iframe.active").attr("src", location);

      console.log("Hmm, " + location);

    });



    // Mouseover fancy-pants stuff
    iframe.find("a").not("a[href*='#'], a[href*='%'], a[href*='javascript:;']").bind("mouseenter", function () {

      $("#url-bar").css("top", "-31px");
      $("#status-bar").text($(this)[0].href).css("top", "0");

    }).bind("mouseleave", function () {

      $("#url-bar").css("top", "0");
      $("#status-bar").css("top", "31px");

    });



    /* DEV
    // Reset positions if hover messes up for some reason
    $("#aries-powerbar").on("mouseenter", function () {

      $("#url-bar").css("top", "0");
      $("#status-bar").css("top", "31px");

      console.log("Reset hover");

    });
    */



    /*
    if ($("a[href*='/pdf']").length > 0) {
      _pagePDF();
    }
    */





    // Don't show anything in address bar if on start page,
    // but put it in focus
    if ($("#url-bar").val() === "app://aries/app.nw/pages/start.html") {
      $("#url-bar").val("").focus();
    }

    // Set iframe to start page on blank page
    if ($("#url-bar").val() === "about:blank") {
      $("iframe.active").attr("src", "pages/start.html");
    }

    // Notification when on certain sites
    var uri = new URI(baseURL);

    // Uncomment below to find hostname parameter
    // console.log(uri.hostname());

    if (uri.hostname() == "www.facebook.com") {
      var fbNotify = iframe.find("#notificationsCountValue").text();

      if (fbNotify > 0) {
        $("button.active .tab-favicon").before("<span class='notification-count'>" + fbNotify + "</span>");
        // $(".notification-count").css("opacity", "1");
      } else {
        $(".notification-count").css("opacity", "0");
      }
    }

    if (uri.hostname() == "www.deviantart.com") {
      var daNotify = $.trim(iframe.find("#oh-menu-split .oh-l").text());

      if (daNotify !== "undefined") {
        $("button.active .tab-favicon").before("<span class='notification-count'>" + daNotify + "</span>");
        // $(".notification-count").css("opacity", "1");
      } else {
        // $(".notification-count").css("opacity", "0");
      }
    }

    /*
    if ($("#url-bar").val() == "http://data:test/html,chromewebdata") {
      console.log("nope");
    }
    */
  });

  NProgress.done();

}

function _pageAbout() {

  console.log("Internal Aries link!");

  $("iframe.active").attr("src", "pages/about.html");
  $("button.active").attr("data-page", "pages/about.html");

  setTimeout(function () {
    $("#url-bar").val("about");
    $("#aries-titlebar h1").text("Aries /// About");
    $("button.active .tab-title").text("About Aries");
  }, 100);

}

function _pageCredits() {

  console.log("Internal Aries link!");

  $("iframe.active").attr("src", "pages/credits.html");
  $("button.active").attr("data-page", "pages/credits.html");

  setTimeout(function () {
    $("#url-bar").val("credits");
    $("#aries-titlebar h1").text("Aries /// Credits");
    $("button.active .tab-title").text("Aries Credits");
  }, 100);

}

function _ghostery() {

  console.log("Internal Aries link!");

  $("iframe.active").attr("src", "resources/ghostery/walkthrough.html");
  $("button.active").attr("data-page", "resources/ghostery/walkthrough.html");

  setTimeout(function () {
    $("#url-bar").val("ghostery");
    $("#aries-titlebar h1").text("Aries /// Ghostery");
    $("button.active .tab-title").text("Ghostery");
  }, 100);

}

// Search, using DuckDuckGo
function _searchDDG() {

  // looks like input isn't a URL, so search!
  var encodeSearch = "https://duckduckgo.com/?q=" + encodeURIComponent($("#url-bar").val());

  $("iframe.active").attr("src", encodeSearch);
  $("button.active").attr("data-page", encodeSearch);

  // Make sure to mention !bangs in the future readme: https://duckduckgo.com/bang.html

}

// Go to a website, or search for something
function goThere() {

  // 1070 TLDs!
  // TLD list: https://data.iana.org/TLD/tlds-alpha-by-domain.txt
  // created a custom app to take IANA's list out of caps
  // Version 2015092700, Last Updated Sun Sep 27 07:07:01 2015 UTC

  var url = /(\S+\.(aaa|abb|abbott|abogado|ac|academy|accenture|accountant|accountants|aco|active|actor|ad|ads|adult|ae|aeg|aero|af|afl|ag|agency|ai|aig|airforce|airtel|al|allfinanz|alsace|am|amica|amsterdam|android|ao|apartments|app|aq|aquarelle|ar|archi|army|arpa|as|asia|associates|at|attorney|au|auction|audio|auto|autos|aw|ax|axa|az|azure|ba|band|bank|bar|barcelona|barclaycard|barclays|bargains|bauhaus|bayern|bb|bbc|bbva|bcn|bd|be|beer|bentley|berlin|best|bet|bf|bg|bh|bharti|bi|bible|bid|bike|bing|bingo|bio|biz|bj|black|blackfriday|bloomberg|blue|bm|bms|bmw|bn|bnl|bnpparibas|bo|boats|bom|bond|boo|boots|boutique|br|bradesco|bridgestone|broker|brother|brussels|bs|bt|budapest|build|builders|business|buzz|bv|bw|by|bz|bzh|ca|cab|cafe|cal|camera|camp|cancerresearch|canon|capetown|capital|car|caravan|cards|care|career|careers|cars|cartier|casa|cash|casino|cat|catering|cba|cbn|cc|cd|ceb|center|ceo|cern|cf|cfa|cfd|cg|ch|chanel|channel|chat|cheap|chloe|christmas|chrome|church|ci|cisco|citic|city|ck|cl|claims|cleaning|click|clinic|clothing|cloud|club|cm|cn|co|coach|codes|coffee|college|cologne|com|commbank|community|company|computer|condos|construction|consulting|contractors|cooking|cool|coop|corsica|country|coupons|courses|cr|credit|creditcard|cricket|crown|crs|cruises|csc|cu|cuisinella|cv|cw|cx|cy|cymru|cyou|cz|dabur|dad|dance|date|dating|datsun|day|dclk|de|deals|degree|delivery|delta|democrat|dental|dentist|desi|design|dev|diamonds|diet|digital|direct|directory|discount|dj|dk|dm|dnp|do|docs|dog|doha|domains|doosan|download|drive|durban|dvag|dz|earth|eat|ec|edu|education|ee|eg|email|emerck|energy|engineer|engineering|enterprises|epson|equipment|er|erni|es|esq|estate|et|eu|eurovision|eus|events|everbank|exchange|expert|exposed|express|fage|fail|faith|family|fan|fans|farm|fashion|feedback|fi|film|final|finance|financial|firmdale|fish|fishing|fit|fitness|fj|fk|flights|florist|flowers|flsmidth|fly|fm|fo|foo|football|forex|forsale|forum|foundation|fr|frl|frogans|fund|furniture|futbol|fyi|ga|gal|gallery|game|garden|gb|gbiz|gd|gdn|ge|gea|gent|genting|gf|gg|ggee|gh|gi|gift|gifts|gives|giving|gl|glass|gle|global|globo|gm|gmail|gmo|gmx|gn|gold|goldpoint|golf|goo|goog|google|gop|gov|gp|gq|gr|graphics|gratis|green|gripe|group|gs|gt|gu|guge|guide|guitars|guru|gw|gy|hamburg|hangout|haus|healthcare|help|here|hermes|hiphop|hitachi|hiv|hk|hm|hn|hockey|holdings|holiday|homedepot|homes|honda|horse|host|hosting|hoteles|hotmail|house|how|hr|hsbc|ht|hu|hyundai|ibm|icbc|ice|icu|id|ie|ifm|iinet|il|im|immo|immobilien|in|industries|infiniti|info|ing|ink|institute|insure|int|international|investments|io|ipiranga|iq|ir|irish|is|ist|istanbul|it|itau|iwc|java|jcb|je|jetzt|jewelry|jlc|jll|jm|jo|jobs|joburg|jp|jprs|juegos|kaufen|kddi|ke|kg|kh|ki|kia|kim|kitchen|kiwi|km|kn|koeln|komatsu|kp|kr|krd|kred|kw|ky|kyoto|kz|la|lacaixa|lancaster|land|lasalle|lat|latrobe|law|lawyer|lb|lc|lds|lease|leclerc|legal|lexus|lgbt|li|liaison|lidl|life|lighting|limited|limo|linde|link|live|lixil|lk|loan|loans|lol|london|lotte|lotto|love|lr|ls|lt|ltd|ltda|lu|lupin|luxe|luxury|lv|ly|ma|madrid|maif|maison|man|management|mango|market|marketing|markets|marriott|mba|mc|md|me|media|meet|melbourne|meme|memorial|men|menu|mg|mh|miami|microsoft|mil|mini|mk|ml|mm|mma|mn|mo|mobi|moda|moe|mom|monash|money|montblanc|mormon|mortgage|moscow|motorcycles|mov|movie|movistar|mp|mq|mr|ms|mt|mtn|mtpc|mu|museum|mv|mw|mx|my|mz|na|nadex|nagoya|name|navy|nc|ne|nec|net|netbank|network|neustar|new|news|nexus|nf|ng|ngo|nhk|ni|nico|ninja|nissan|nl|no|nokia|np|nr|nra|nrw|ntt|nu|nyc|nz|obi|office|okinawa|om|omega|one|ong|onl|online|ooo|oracle|orange|org|organic|osaka|otsuka|ovh|pa|page|panerai|paris|partners|parts|party|pe|pet|pf|pg|ph|pharmacy|philips|photo|photography|photos|physio|piaget|pics|pictet|pictures|pink|pizza|pk|pl|place|play|plumbing|plus|pm|pn|pohl|poker|porn|post|pr|praxi|press|pro|prod|productions|prof|properties|property|protection|ps|pt|pub|pw|py|qa|qpon|quebec|racing|re|realtor|realty|recipes|red|redstone|rehab|reise|reisen|reit|ren|rent|rentals|repair|report|republican|rest|restaurant|review|reviews|rich|ricoh|rio|rip|ro|rocks|rodeo|rs|rsvp|ru|ruhr|run|rw|ryukyu|sa|saarland|sakura|sale|samsung|sandvik|sandvikcoromant|sanofi|sap|sarl|saxo|sb|sc|sca|scb|schmidt|scholarships|school|schule|schwarz|science|scor|scot|sd|se|seat|security|seek|sener|services|seven|sew|sex|sexy|sg|sh|shiksha|shoes|show|shriram|si|singles|site|sj|sk|ski|sky|skype|sl|sm|sn|sncf|so|soccer|social|software|sohu|solar|solutions|sony|soy|space|spiegel|spreadbetting|sr|srl|st|stada|starhub|statoil|stc|stcgroup|stockholm|studio|study|style|su|sucks|supplies|supply|support|surf|surgery|suzuki|sv|swatch|swiss|sx|sy|sydney|systems|sz|taipei|tatamotors|tatar|tattoo|tax|taxi|tc|td|team|tech|technology|tel|telefonica|temasek|tennis|tf|tg|th|thd|theater|theatre|tickets|tienda|tips|tires|tirol|tj|tk|tl|tm|tn|to|today|tokyo|tools|top|toray|toshiba|tours|town|toyota|toys|tr|trade|trading|training|travel|trust|tt|tui|tv|tw|tz|ua|ubs|ug|uk|university|uno|uol|us|uy|uz|va|vacations|vc|ve|vegas|ventures|versicherung|vet|vg|vi|viajes|video|villas|vin|vision|vista|vistaprint|viva|vlaanderen|vn|vodka|vote|voting|voto|voyage|vu|wales|walter|wang|watch|webcam|website|wed|wedding|weir|wf|whoswho|wien|wiki|williamhill|win|windows|wine|wme|work|works|world|ws|wtc|wtf|xbox|xerox|xin|xn--11b4c3d|xn--1qqw23a|xn--30rr7y|xn--3bst00m|xn--3ds443g|xn--3e0b707e|xn--3pxu8k|xn--42c2d9a|xn--45brj9c|xn--45q11c|xn--4gbrim|xn--55qw42g|xn--55qx5d|xn--6frz82g|xn--6qq986b3xl|xn--80adxhks|xn--80ao21a|xn--80asehdb|xn--80aswg|xn--90a3ac|xn--90ais|xn--9dbq2a|xn--9et52u|xn--b4w605ferd|xn--c1avg|xn--c2br7g|xn--cg4bki|xn--clchc0ea0b2g2a9gcd|xn--czr694b|xn--czrs0t|xn--czru2d|xn--d1acj3b|xn--d1alf|xn--efvy88h|xn--estv75g|xn--fhbei|xn--fiq228c5hs|xn--fiq64b|xn--fiqs8s|xn--fiqz9s|xn--fjq720a|xn--flw351e|xn--fpcrj9c3d|xn--fzc2c9e2c|xn--gecrj9c|xn--h2brj9c|xn--hxt814e|xn--i1b6b1a6a2e|xn--imr513n|xn--io0a7i|xn--j1aef|xn--j1amh|xn--j6w193g|xn--kcrx77d1x4a|xn--kprw13d|xn--kpry57d|xn--kput3i|xn--l1acc|xn--lgbbat1ad8j|xn--mgb9awbf|xn--mgba3a4f16a|xn--mgbaam7a8h|xn--mgbab2bd|xn--mgbayh7gpa|xn--mgbbh1a71e|xn--mgbc0a9azcg|xn--mgberp4a5d4ar|xn--mgbpl2fh|xn--mgbx4cd0ab|xn--mk1bu44c|xn--mxtq1m|xn--ngbc5azd|xn--node|xn--nqv7f|xn--nqv7fs00ema|xn--nyqy26a|xn--o3cw4h|xn--ogbpf8fl|xn--p1acf|xn--p1ai|xn--pgbs0dh|xn--pssy2u|xn--q9jyb4c|xn--qcka1pmc|xn--rhqv96g|xn--s9brj9c|xn--ses554g|xn--t60b56a|xn--tckwe|xn--unup4y|xn--vermgensberater-ctb|xn--vermgensberatung-pwb|xn--vhquv|xn--vuq861b|xn--wgbh1c|xn--wgbl6a|xn--xhq521b|xn--xkc2al3hye2a|xn--xkc2dl3a5ee0h|xn--y9a3aq|xn--yfro4i67o|xn--ygbi2ammx|xn--zfr164b|xperia|xxx|xyz|yachts|yandex|ye|yodobashi|yoga|yokohama|youtube|yt|za|zip|zm|zone|zuerich|zw)|([0-9])(\/\S+)?)/;

  var a = url.test($("#url-bar").val());

  // check to see if input is a URL
  // apparently, encodeURIComponent fucks up URLs. Hooray for learning!
  // var encodeURL = "http://" + encodeURI($("#url-bar").val());
  var encodeURL = encodeURI($("#url-bar").val());

  // Figure out if we need to prepend "http://" to URLs
  function decipher() {

    if (encodeURL.match(/(^http:\/\/)|(^https:\/\/)/) !== null) {

      console.log("This URL already contains 'http://'");

      $("iframe.active").attr("src", encodeURL);
      $("button.active").attr("data-page", encodeURL);

    } else if (encodeURL.match(/(%20)/) !== null) {

      console.log("spaces!"); // almost deals with numbers in the URL bar. Almost.
      _searchDDG();

    } else if (encodeURL.match(/(^http:\/\/127.0.0.1:2000)/) !== null) {

      $("button.active .tab-title").html("Console");
      console.log("console");

    } else if (encodeURL.match(/(pdf)/) !== null) {

      // _pagePDF();

    } else {

      console.log("This URL did not contain 'http://'");

      $("iframe.active").attr("src", "http://" + encodeURL);
      $("button.active").attr("data-page", "http://" + encodeURL);

    }

  }

  decipher();



  var currentTitle = $("iframe.active").contents().find("title").html(); // get current iframe title

  $("button.active .tab-title").html(currentTitle);
  $("button.active .tab-favicon").attr("src", getFavicon);

  if (encodeURL.match(/(^https:\/\/)/) !== null) {
    $("button.active").addClass("secure-site");
  }

  $("#aries-titlebar h1").html(currentTitle);



  if (url.test($("#url-bar").val()) === true) {

    console.log(a); // should be true, go to actual site

    /*
    if (a === "data:test/html,chromewebdata") {
      console.log("sdgffdg");
    }

    process.on("net::ERR_NAME_NOT_RESOLVED", function (error) { console.log("Aries Error: " + error); });
    */

  } else {

    if (encodeURL.match(/(^aries:\/\/about)/) !== null) {

      _pageAbout();

    } else if (encodeURL.match(/(^aries:\/\/credits)/) !== null) {

      _pageCredits();

    } else if (encodeURL.match(/(^about:blank)/) !== null) {

      $("iframe.active").attr("src", "pages/start.html");

    } else {

      console.log(a); // should be false, search DDG
      _searchDDG();

    }

  }

}



/*
// This isn't the best way to deal with errors, but at least Aries doesn't crash
process.on("uncaughtException", function (err) {

  // console.dir(err);
  console.log(err);
  console.log("Error trace: " + err.stack);
  // process.exit(); // quits the app

});
*/
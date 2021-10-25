const fileReader = new FileReader();
let carbonData;

class csvData {
  states = {};
  async parseData() {
    let data = await fetch('climate1.csv')
    let data2 = await fetch('goals.csv')
    data = await data.text()
    data2 = await data2.text()
    const sheet1 = Papa.parse(data, {
      header: true,
      dynamicTyping: true,
    })
    const sheet2 = Papa.parse(data2, {
      header: true,
      dynamicTyping: true,
    })
    this.mapSheetOne(sheet1);
    this.mapSheetTwo(sheet2);
  }
  async mapSheetOne(results){
    const {
      states
    } = this
    results.data.forEach(({
      STATE_Abbr,
      POLICY_Sector,
      POLICY_abbr,
      ...datum
    }) => {
      if (states[STATE_Abbr]) {
        if (states[STATE_Abbr][POLICY_abbr]) {
          states[STATE_Abbr][POLICY_abbr].push(datum)
        } else {
          states[STATE_Abbr][POLICY_abbr] = [datum]
        }
      } else {
        states[STATE_Abbr] = {
          [POLICY_abbr]: [datum],
          STATE_Name: datum.STATE_Name,
          goals: []
        }
      }
    })
  }
  async mapSheetTwo(results){
    for (let state of results.data) {
      if(this.states[state.State_Abbr]){
        this.states[state.State_Abbr].goals.push(state)
      } else {
        this.states[state.State_Abbr] = {
          goals:[state],
          STATE_Name: state.STATE_Name
        }
      }
    }
  }

  searchByPolicySector = (sect) => {
    const {
      states
    } = this
    let result = [];
    for (let state in states) {
      if (states[state][sect]) {
        result.push({
          stateAbbr: state,
          stateName: states[state]["STATE_Name"],
        })
      }
    }
    result = result.sort((a, b) => a.stateName.localeCompare(b.stateName))
    return result
  }
  //returns a list of state abbreviations that contain the targeted policy sector
  //
  targetInfoSearch = (stateAbbr, targetDate1) => {
    const {
      states
    } = this
    let result = [];
    for (let goal of states[stateAbbr].goals) {
      if (goal.Target_Date_1 == targetDate1) {
        result.push(goal)
      }
    }
    if (result.length == 0) {
      return null
    }
    result = result.sort((a, b) => a.stateName.localeCompare(b.stateName))
    return result;
  }
  targetInfo2Search = (stateAbbr, targetDate2) => {
    const {
      states
    } = this
    let result = [];
    for (let goal of states[stateAbbr].goals) {
      if (goal.Target_Date_2 == targetDate2) {
        result.push(goal)
      }
    }
    if (result.length == 0) {
      return null
    }
    result = result.sort((a, b) => a.stateName.localeCompare(b.stateName))
    return result;
  }
  targetDateSearch = (targetDate1) => {
    const {
      states
    } = this
    let result = [];
    for (let state in states) {
      let hasDate = false;
      for (let goal of states[state].goals) {
        if (goal.Target_Date_1 == targetDate1) {
          hasDate = true;
        }
      }
      if (hasDate) {
        result.push(state)
      }
    }
    return result
  }
  targetDate2Search = (targetDate2) => {
    const {
      states
    } = this
    let result = [];
    for (let state in states) {
      let hasDate = false;
      for (let goal of states[state].goals) {
        if (goal.Target_Date_2 == targetDate2) {
          hasDate = true;
        }
      }
      if (hasDate) {
        result.push(state)
      }
    }
    return result
  }
}

//example of how to use the code, make sure everything you write is contained in the .then or it will likely break. The file import of the csv is asynchonous
const csv = new csvData()
csv.parseData().then(() => {
  // this sets the css and list of states for the target dates.  no clicking is required to fill out this info b/c it's hidden by css until the classes change later
  for (let abbr in csv.states) {
    const data = csv.targetInfoSearch(abbr, "2025-2030")
    if (data) {
      $("#content_2030 .targettables .one").append('<tr><td>' + data["0"]["State_Name"] + '</td><td>' + data["0"]["Target_Info_1"] + '</td></tr>');
      $("#body").append('<style>#map-svg.selected_2030 #' + abbr + ', #map-svg.selected_2030 #' + abbr + '-box {fill: #FDB515;}</style>');
    }
  }
  for (let abbr in csv.states) {
    const data = csv.targetInfo2Search(abbr, "Post 2030")
    if (data) {
      $("#content_post .targettables .one").append('<tr><td>' + data["0"]["State_Name"] + '</td><td>' + data["0"]["Target_Info_2"] + '</td></tr>');
      $("#body").append('<style>#map-svg.selected_post #' + abbr + ', #map-svg.selected_post #' + abbr + '-box {fill: #FDB515;}</style>');
    }
  }

  //table sorter code
  $('table').tablesorter({
    sortReset: false,
    sortRestart: false
  });

  // calls up all the sectors
  var industry = csv.searchByPolicySector("hover_industry");
  var cross = csv.searchByPolicySector("hover_cross");
  var transportation = csv.searchByPolicySector("hover_transportation");
  var energy = csv.searchByPolicySector("hover_energy");
  var building = csv.searchByPolicySector("hover_building");
  var natural = csv.searchByPolicySector("hover_natural");
  var sector;
  window.clicked_state = null;
  window.clicked_sector = null;

  function build_table(policies) {
    $("#sector-tabs").css('display', 'flex');
    $(".table-data").remove();
    $("#state-policies #policies-table").hide();
    if (policies) {
      $("#state-policies #policies-table").show();
      $("#no-results").hide();
    } else {
      $("#no-results").show()
    }
    jQuery.each(policies, function (i, val) {
      if (val.POLICY_Type == null) {
        val.POLICY_Type = ""
      };
      if (val.POLICY_url == null) {
        val.POLICY_url = ""
      };
      if (val.POLICY_Name == null) {
        val.POLICY_Name = ""
      };
      if (val.POLICY_YearPublish == null) {
        val.POLICY_YearPublish = ""
      };
      if (val.POLICY_Description == null) {
        val.POLICY_Description = ""
      };
      $("#state-policies #policies-table").append('<tr class="table-data"><td><a href="' + val.POLICY_url + '">' + val.POLICY_Name + '</a></td><td>' + val.POLICY_YearPublish + '</td><td>' + val.POLICY_Type + '</td><td>' + val.POLICY_Description + '</td></tr>');
    });
    $('table').trigger('update');
  }

  function set_state_active(state) {
    $("#map-svg *").removeClass("selected-state");
    $("#map-svg #" + state).addClass("selected-state");
    $("#map-svg #" + state + "-box").addClass("selected-state");

  }

  function set_sector_active(sector, sector2) {
    console.log({sector, sector2});
    $("#climate-action-map-wrapper input + label").css("color", "#46535E");
    $("#climate-action-map-wrapper input#" + sector + "+ label").css("color", "#C4820E");

    if ($("#sector-tabs li").hasClass(sector2)) {
      $("#sector-tabs li." + sector).addClass("active-tab");
    }
  }

  function set_map_active(sector) {
    $("#map-svg").removeClass();
    $("#climate-action-map-content").removeClass();
    if (sector == "hover_energy") {
      $("#map-svg").addClass('selected_energy');
      $("#climate-action-map-content").addClass("selected_energy");
    }
    if (sector == "hover_building") {
      $("#map-svg").addClass('selected_building');
      $("#climate-action-map-content").addClass("selected_building");
    }
    if (sector == "hover_cross") {
      $("#map-svg").addClass('selected_cross');
      $("#climate-action-map-content").addClass("selected_cross");
    }
    if (sector == "hover_industry") {
      $("#map-svg").addClass('selected_industry');
      $("#climate-action-map-content").addClass("selected_industry");
    }
    if (sector == "hover_transportation") {
      $("#map-svg").addClass('selected_transportation');
      $("#climate-action-map-content").addClass("selected_transportation");
    }
    if (sector == "hover_natural") {
      $("#map-svg").addClass('selected_natural');
      $("#climate-action-map-content").addClass("selected_natural");
    }
    if (sector == "hover_2030") {
      $("#map-svg").addClass('selected_2030');
      $("#climate-action-map-content").addClass("selected_2030");
    }
    if (sector == "hover_post") {
      $("#map-svg").addClass('selected_post');
      $("#climate-action-map-content").addClass("selected_post");
    }
  }
 $('#default-state').click(e => {
   $('#sector-tabs li').removeClass('active-tab')
 })
  function about_tab(state) {
    generateStateChart(csv.states[state].STATE_Name)
    var about_data = csv.states[state]['goals'][0]['About'];
    var target_date_1 = csv.states[state]['goals'][0]['Target_Date_1'];
    var target_info_1 = csv.states[state]['goals'][0]['Target_Info_1'];
    var target_date_2 = csv.states[state]['goals'][0]['Target_Date_2'];
    var target_info_2 = csv.states[state]['goals'][0]['Target_Info_2'];
    if (target_date_1 == null) {
      date_1 = '<h3 class="target-date">2025-2030 </h3><p>NONE</p>';
    } else {
      date_1 = '<h3 class="target-date">2025-2030 </h3><p>' + target_info_1; + '</p>'
    }
    if (target_date_2 == null) {
      date_2 = '<h3 class="target-date">POST 2030</h3><p>NONE</p>';
    } else {
      date_2 = '<h3 class="target-date">POST 2030</h3><p>' + target_info_2 + '</p>';
    }
    $("#state-policies #policies-name").replaceWith('<h2 id="policies-name">' + csv.states[state]['goals'][0]['State_Name'] + '</h2>');
    $("#about-content").html("<div>" + date_1 + "</div>" + "<div>" + date_2 + "</div>");
    $("#about-tab").css("display", "none");
    $("#sector-tabs").css('display', 'flex');
  }

  // this sets the css and list of states for the sectors.  no clicking is required to fill out this info b/c it's hidden by css until the classes change later
  jQuery.each(industry, function (i, val) {
    $("#body").append('<style>#map-svg.selected_industry #' + val.stateAbbr + ', #map-svg.selected_industry #' + val.stateAbbr + '-box {fill: #FDB515;}</style>');
    $("#content_industry .noborder").append('<span class="state-name-comma" id="' + val.stateAbbr + '">' + val.stateName + '</span>');
  });

  jQuery.each(cross, function (i, val) {
    $("#body").append('<style>#map-svg.selected_cross #' + val.stateAbbr + ', #map-svg.selected_cross #' + val.stateAbbr + '-box {fill: #FDB515;}</style>');
    $("#content_cross .noborder").append('<span class="state-name-comma" id="' + val.stateAbbr + '">' + val.stateName + '</span>');

  });

  jQuery.each(natural, function (i, val) {
    $("#body").append('<style>#map-svg.selected_natural #' + val.stateAbbr + ', #map-svg.selected_natural #' + val.stateAbbr + '-box {fill: #FDB515;}</style>');
    $("#content_natural .noborder").append('<span class="state-name-comma" id="' + val.stateAbbr + '">' + val.stateName + '</span>');
  });

  jQuery.each(building, function (i, val) {
    $("#body").append('<style>#map-svg.selected_building #' + val.stateAbbr + ', #map-svg.selected_building #' + val.stateAbbr + '-box {fill: #FDB515;}</style>');
    $("#content_building .noborder").append('<span class="state-name-comma" id="' + val.stateAbbr + '">' + val.stateName + '</span>');
  });

  jQuery.each(transportation, function (i, val) {
    $("#body").append('<style>#map-svg.selected_transportation #' + val.stateAbbr + ', #map-svg.selected_transportation #' + val.stateAbbr + '-box {fill: #FDB515;}</style>');
    $("#content_transportation .noborder").append('<span class="state-name-comma" id="' + val.stateAbbr + '">' + val.stateName + '</span>');
  });

  jQuery.each(energy, function (i, val) {
    $("#body").append('<style>#map-svg.selected_energy #' + val.stateAbbr + ', #map-svg.selected_energy #' + val.stateAbbr + '-box {fill: #FDB515;}</style>');
    $("#content_energy .noborder").append('<span class="state-name-comma" id="' + val.stateAbbr + '">' + val.stateName + '</span>');
  });

  // this makes it so it doesn't hold on to the last checked item on page reload.  
  $("#climate-action-map-wrapper input").prop("checked", false);

  //accordion code
  $('#definitions h3').click(e => {
    //number in slidetoggle controls speed
    $(`#${e.target.dataset.target}`).slideToggle(950)
  })


  $("#map-svg .default-state").on("click", function (event) {
    window.clicked_state = [this.id];
    sector = window.clicked_sector
    set_state_active(window.clicked_state);
    if (sector == 'hover_post' || sector == 'hover_2030') {
      $("#sector-tabs li").removeClass("active-tab");
      $('#no-results').hide()
      $("#state-policies #policies-table").hide();
      $("#climate-action-map-wrapper input + label").css("color", "#46535E");
    }
    if(sector){
    var policies = csv.states[window.clicked_state][sector];
    build_table(policies);
  }
  about_tab(this.id);
  if(sector == null || sector == 'hover_about'){
    $('.hover_about').addClass('active-tab');
    $('#no-results').hide()
    $("#state-policies #policies-table").hide();
    $("#climate-action-map-wrapper input + label").css("color", "#46535E");
    $("#about-tab").css("display", "block");
    }
  }
  )

  $("#climate-action-map-legend .legend_radios").on("click", function (event) {
    $("#state-policies #policies-table").css("display", "block");
    $("#state-policies #policies-table #no-results").remove();
    sector = [this.id][0];
    window.clicked_sector = sector;
    set_map_active(sector);
    if (sector == 'hover_post' || sector == 'hover_2030' || sector == 'hover_reset') {
      window.clicked_state = null;
      $("#map-svg *").removeClass("selected-state");
      $(".table-data").remove();
      $("#state-policies #policies-table").append('<tr class="table-data" id="begin-table"><td colspan="4">Click on a state to see the policies in each sector</td></tr>');
      $("#about-tab").css("display", "none");
      $("#state-policies #policies-name").replaceWith('<h2 id="policies-name"></h2>');
      $("#state-policies #policies-table").hide();
      $("#sector-tabs").css('display', 'none');
    } else {
      $("#sector-tabs").css('display', 'flex');
      $("#about-tab").css("display", "none");
    }
    $("#sector-tabs li").removeClass("active-tab");
    set_sector_active(sector, window.clicked_sector);
    if (window.clicked_state != undefined) {
      var policies = csv.states[window.clicked_state][sector];
      build_table(policies);
    }
    // if they click on a state while the target date tabs are active
    $("#map-svg .default-state").on("click", function (event) {
      $("#climate-action-map-content").removeClass();
      // if they click on a state after hitting reset
      if (sector == 'hover_reset') {
        $("#about-tab").css("display", "block");
        $("#sector-tabs li.hover_about").addClass("active-tab");

      }

    });


  });

  // if they click on the tabs
  $("#sector-tabs li").on("click", function (event) {
    sector = $(this).attr("class");
    window.clicked_sector = sector;
    $("#sector-tabs li").removeClass("active-tab");
    if (sector == "hover_about") {
      $('#no-results').hide()
      $("#state-policies #policies-table").hide();
      $("#climate-action-map-wrapper input + label").css("color", "#46535E");
      $("#about-tab").css("display", "block");

    } else {
      $("#state-policies #policies-table").css("display", "block");
      $("#about-tab").css("display", "none");
      var policies = csv.states[window.clicked_state][sector];
      build_table(policies);
    }
    set_map_active(sector);
    set_sector_active(sector, window.clicked_sector);
  });


  // and if they click on the printed out list
  $(".state-name-comma").on("click", function (event) {
    window.clicked_state = [this.id];
    sector = window.clicked_sector;
    set_state_active(window.clicked_state);
    var policies = csv.states[window.clicked_state][sector];
    build_table(policies);
    about_tab([this.id]);
    set_sector_active(sector, window.clicked_sector);
  });
})
/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* global $ */

'use strict';

$(document).ready(function() {

  // jquery dom variables
  var $conceptAPIData = $('#concepts-panel-input-api-data'),
    $textAPIData = $('#text-panel-input-api-data');

  var concept_array = [];
  var test_concepts = [
    '/graphs/wikipedia/en-20120601/concepts/Artificial_intelligence',
    '/graphs/wikipedia/en-20120601/concepts/Supercomputer'
  ];

  /**
   * Event handler for tab changes
   */
  $('.tab-panels--tab').click(function(e) {
    e.preventDefault();
    var self = $(this);
    var inputGroup = self.closest('.tab-panels');
    var idName = null;

    inputGroup.find('.tab-panels--tab.active').removeClass('active');
    inputGroup.find('.tab-panels--tab-pane.active').removeClass('active');
    self.addClass('active');
    idName = self.attr('href');
    $(idName).addClass('active');
    show_API_panel(idName + '-API');
  });

  function show_API_panel(api_panel_id){
    $('.input--API').removeClass('active');
    $(api_panel_id).addClass('active');
  }

  $('.concept--new-concept-container').click(function(e) {
    e.preventDefault();
    var self = $(this);
    var concept = self.closest('.concept');

    concept.find('.active').removeClass('active');
    concept.find('.concept--input-container').addClass('active');
  });

  function sourceLabelSearch(query, callback) {
    return $.get('/api/labelSearch', {
      query: query,
      limit: 7
    }).done(function(results) {
      $conceptAPIData.empty();
      $conceptAPIData.append($('<pre style="white-space: pre-wrap">').html(JSON.stringify(results, null, 2)));

      var filtered = {};
      filtered['matches'] = results.matches.filter(function(elem) {
        return elem.id.match(/^\/graphs/);
      });
      callback(filtered);
    }).fail(function(error) {
      console.log('labelSearch error:', error);
    });
  }


  function selectionCallback(concept) {
      console.log('concept_label: ' + concept.id);
      var label = concept.label;
      var $template = $('.concept').last().clone();
      $template.find('.label').text(label);
      $template.insertBefore('.concept:nth-last-child(1)');
      $('.concept:nth-last-child(1) > .concept--input-container').empty();
      $('.concept:nth-last-child(1) > .concept--input-container')
        .html('<form action=""><input class="concept--input" type="text">');
      $('.concept--input').citypeahead({
        selectionCb : selectionCallback,
        hint: false
      },{
	  source : sourceLabelSearch
      });

      $conceptAPIData.empty();
      $('.concept:nth-last-child(1) > .concept--input-container').removeClass('active');
      $('.concept:nth-last-child(1) > .concept--new-concept-container').addClass('active');
  }

  $('.concept--input').citypeahead({
      selectionCb : selectionCallback,
      hint: false
  },{
      source: sourceLabelSearch
  });



  $.get('/api/conceptualSearch', {
      ids: test_concepts,
      limit: 3,
      document_fields: JSON.stringify({ user_fields: 1})
    })
    .done(function(results) {

            console.log('conceptualSearch:', JSON.stringify(results, null, 2));


      console.log('TED Title: ' + results.results[0].user_fields.title);
      console.log('TED speaker: ' + results.results[0].user_fields.speaker);
      console.log('TED score: ' + results.results[0].score);
      console.log('TED thumbnail: ' + results.results[0].user_fields.thumbnail);
      console.log('TED mentions: ' + results.results[0].explanation_tags[0].concept.split('/')[5]);
      console.log('TED input concept: ' + results.query_concepts[0].id.split('/')[5]);

      var $TED1_tile_above = $('#TED1-panel > .base--textarea > ._TED-panel--TED > .TED--info-above');
      $TED1_tile_above.find('.TED--title').html(results.results[0].user_fields.title);
      $TED1_tile_above.find('.TED--author').html(results.results[0].user_fields.speaker);
      $TED1_tile_above.find('.TED--score > .TED--score-value').html(results.results[0].score);

      var $TED1_tile_below = $('#TED1-panel > .base--textarea > ._TED-panel--TED > .TED--info-below');
      $TED1_tile_below.find('.TED--title').html(results.results[0].user_fields.title);
      $TED1_tile_below.find('.TED--author').html(results.results[0].user_fields.speaker);
      $TED1_tile_below.find('.TED--score > .TED--score-value').html(results.results[0].score);

      var $TED1_thumbnail = $('#TED1-panel > .base--textarea > ._TED-panel--TED > .TED--img');
      $TED1_thumbnail.find('img').attr('src', results.results[0].user_fields.thumbnail);

      var $TED_input_list = $('#TED1-panel > .base--textarea > ._TED-panel--how-it-works > .how-it-works--graph > .concept--your-input-list');
      for(var i = 0; i < results.query_concepts.length; i++){
        var TED_input_concept_tile = '<div class="concept--your-input"><span class="concept--typed-concept">' + results.query_concepts[i].id.split('/')[5] + '</span></div>';
        $TED_input_list.append(TED_input_concept_tile);
      }

      var $TED_derived_concept_list = $('#TED1-panel > .base--textarea > ._TED-panel--how-it-works > .how-it-works--graph > .concept--derived-concept-list');
      for(var i = 0; i < results.results[0].explanation_tags.length; i++){
        var TED_mention_tile = '<div class="concept--derived-concept-list-item"><div class="concept--derived-concept"><span class="concept--typed-concept">' + results.results[0].explanation_tags[i].concept.split('/')[5] + '</span></div></div>';
        $TED_derived_concept_list.append(TED_mention_tile);
      }


      console.log('conceptualSearch:', JSON.stringify(results, null, 2));
    }).fail(function(error) {
      error = error.responseJSON ? error.responseJSON.error : error.statusText;
      console.log('error:', error);
    }).always(function() {
      // hide loading bar
    });


  //show loading bar
  console.log('extractConceptMentions');
  $.get('/api/extractConceptMentions', {
      text: $('#body-of-text').text()
    })
    .done(function(results) {

      for(var i = 0; i < results.annotations.length; i ++){
        var concept_list = results.annotations[i].concept.split('/');
        var concept_index = concept_list.length - 1;

        var abstract_concept_div = '<div class="concept--abstract-concept-list-container"><span class="concept--abstract-concept-list-item">' + concept_list[concept_index] + '</span></div>';
        $('.concept--abstract-concept-container').append(abstract_concept_div);
      }

      $textAPIData.empty();
      $textAPIData.append($('<pre style="white-space: pre-wrap">').html(JSON.stringify(results, null, 2)));

    }).fail(function(error) {
      error = error.responseJSON ? error.responseJSON.error : error.statusText;
      console.log('extractConceptMentions error:', error);
    }).always(function() {
      // hide loading bar
    });

});

// var stop_request_time_out = null;

function abstract_concept(){
  update_abstracted_concept();

  // if(stop_request_time_out)
  //   window.clearTimeout(stop_request_time_out);

  // stop_request_time_out = window.setTimeout(stop_request(abstracted_concept_frequence), 5000);
}


function update_abstracted_concept(){
  console.log('come to update abstract concept');

  $.get('/api/extractConceptMentions', {
      text: $('#body-of-text').text()
    })
    .done(function(results) {

      $('.concept--abstract-concept-container').empty();

      for(var i = 0; i < results.annotations.length; i ++){
        var concept_list = results.annotations[i].concept.split('/');
        var concept_index = concept_list.length - 1;

        var abstract_concept_div = '<div class="concept--abstract-concept-list-container"><span class="concept--abstract-concept-list-item">' + decodeURIComponent(concept_list[concept_index]) + '</span></div>';
        $('.concept--abstract-concept-container').append(abstract_concept_div);
      }

      $('#text-panel-input-api-data').empty();
      $('<pre style="white-space: pre-wrap">').html(JSON.stringify(results, null, 2))
        .appendTo('#text-panel-input-api-data');

    }).fail(function(error) {
      error = error.responseJSON ? error.responseJSON.error : error.statusText;
      console.log('extractConceptMentions error:', error);
    }).always(function() {

    });
}

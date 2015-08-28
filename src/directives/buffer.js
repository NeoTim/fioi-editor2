'use strict';
module.exports = function (m) {

m.directive('fioiEditor2Buffer', bufferDirective);
function bufferDirective () {
   return {
      restrict: 'E',
      scope: {
         buffer: '@',
         onInit: '&'
      },
      template: require('./buffer.jade'),
      controllerAs: 'vm',
      bindToController: true,
      require: '^fioiEditor2',
      replace: true,
      controller: BufferController,
      link: function (scope, iElement, iAttrs, editorController) {
         scope.$on('$destroy', function () {
            scope.vm.cleanup();
         });
      }
   };
}

BufferController.$inject = ['$rootScope', 'FioiEditor2Buffers'];
function BufferController ($rootScope, buffers) {

   var controller = this;
   var buffer = buffers.get(this.buffer);
   var editor = null; // the ACE object

   // Load from service and hook up events.
   onBufferChanged();
   var eventMap = {
      changed: onBufferChanged
   };
   var unhookers = _.map(eventMap, function (func, name) {
      return $rootScope.$on('fioi-editor2_buffer-'+buffer.name+'_'+name, func);
   });
   this.cleanup = function () {
      _.each(unhookers, function (func) { func(); });
      buffer.update({
         text: editor.getValue(),
         language: this.language && this.language.name,
         selection: editor.selection.getRange()
      });
   }.bind(this);

   this.aceLoaded = function (editor_) {
      window.editor = editor_;
      editor = editor_;
      editor.setValue(buffer.text);
      editor.selection.setRange(buffer.selection);
      editor.focus();
   };

   function onBufferChanged () {
      controller.languageOptions = buffer.getLanguages();
      controller.language = _.find(controller.languageOptions,
         function (language) { return language.name == buffer.language; });
      controller.text = buffer.text;
   }

}

};
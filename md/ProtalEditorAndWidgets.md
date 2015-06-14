# Portal editor and widgets

Portal editor has two main parts angular template and controller. It downloads data for actual article and

1. gets template name for current article and loads that template as ng-include. This template defines actual page behavior
2. ng-include includes template into scope of editor as part of portal-editor template so all content defined in template is evaluated in portals scope

## Tasks
* translations in portal editor are not ok, has to be corrected

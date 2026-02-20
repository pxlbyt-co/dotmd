-- Fix Django AGENTS.md config title (012- prefix leaked from seed filename)
update configs
set title = 'AGENTS.md — Python + Django'
where slug = 'python-django-agents-md'
  and title = '012-python-django.AGENTS.md';

update public.guide_content
set section = 'howto_software'
where section = 'howto_developer';

update public.guide_content
set title = 'How to Build a Software Portfolio'
where section = 'howto_software';

update public.guide_content
set content = jsonb_set(
  content,
  '{templates,0,id}',
  '"software"'
)
where section = 'template';

update public.guide_content
set content = jsonb_set(
  content,
  '{templates,0,name}',
  '"Software"'
)
where section = 'template';

alter table public.portfolio_contents
  alter column template set default 'software'::text;

update public.portfolio_contents
  set template = 'software'
  where template = 'developer';

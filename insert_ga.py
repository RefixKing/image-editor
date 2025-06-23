import os

analytics_script = '''
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LXF0JVD1CD"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-LXF0JVD1CD');
</script>
'''

adsense_script = '''
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3158623192050019"
     crossorigin="anonymous"></script>
'''

combined_script = analytics_script + '\n' + adsense_script

root_folder = '.'

for foldername, subfolders, filenames in os.walk(root_folder):
    for filename in filenames:
        if filename.endswith('.html'):
            file_path = os.path.join(foldername, filename)
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()

            # Skip if both tags are already present
            if 'G-LXF0JVD1CD' in content and 'ca-pub-3158623192050019' in content:
                continue

            if '</head>' in content:
                new_content = content.replace('</head>', f'{combined_script}\n</head>')
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f'✅ Inserted into: {file_path}')
            else:
                print(f'⚠️ Skipped (no </head>): {file_path}')

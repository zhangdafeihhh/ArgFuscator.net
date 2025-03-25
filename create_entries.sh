#!/bin/bash

for f in models/windows/*.json; do
    name=$(basename "$f" .json)
    cat > "gui/_entries/${name}.html" << EOL
---
layout: entry
slug: ${name}
---
EOL
done 
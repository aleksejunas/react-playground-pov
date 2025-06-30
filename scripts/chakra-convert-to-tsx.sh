#!/bin/bash

# Dette scriptet finner alle .js-filer i src/components og gjør dem om til .tsx
# Legger også til en Chakra UI type-import på toppen av hver fil hvis den ikke finnes

TARGET_DIR="./src/components/ui/"

find "$TARGET_DIR" -type f -name "*.jsx" | while read -r file; do
  newfile="${file%.jsx}.tsx"

  echo "Konverterer: $file → $newfile"

  # Sjekk om fila allerede har Chakra import
  if grep -q "@chakra-ui/react" "$file"; then
    cp "$file" "$newfile"
  else
    echo 'import { Box } from "@chakra-ui/react";' >"$newfile"
    cat "$file" >>"$newfile"
  fi

  # (Valgfritt) Slett original JS-fil
  rm "$file"
done

echo "✅ Ferdig! Alle JS-filer i $TARGET_DIR er nå TSX."

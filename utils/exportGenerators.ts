import { CollectionNode, Raindrop } from '../types';

// Helper to sanitize HTML/XML content
const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Helper to escape CSV values
const escapeCsv = (str: string): string => {
  if (!str) return '';
  const needsQuotes = str.includes(',') || str.includes('"') || str.includes('\n');
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const generateNetscapeFolder = (node: CollectionNode, indentLevel: number): string => {
  // Skip unchecked folders
  if (node.checked === false) return '';

  const indent = "    ".repeat(indentLevel);
  
  // Filter unchecked bookmarks
  const activeBookmarks = node.bookmarks.filter(b => b.checked !== false);

  const itemsHtml = activeBookmarks.map(b => {
    const tags = b.tags && b.tags.length > 0 ? ` TAGS="${b.tags.join(',')}"` : '';
    const date = b.created ? ` ADD_DATE="${new Date(b.created).getTime() / 1000}"` : '';
    return `${indent}    <DT><A HREF="${escapeHtml(b.link)}"${date}${tags}>${escapeHtml(b.title)}</A>`;
  }).join('\n');

  let childrenHtml = '';
  if (node.children.length > 0) {
    childrenHtml = node.children.map(child => generateNetscapeFolder(child, indentLevel + 1)).join('\n');
  }

  // Netscape format for folders
  return `
${indent}<DT><H3 ADD_DATE="${node.created ? new Date(node.created).getTime() / 1000 : 0}">${escapeHtml(node.title)}</H3>
${indent}<DL><p>
${itemsHtml}
${childrenHtml}
${indent}</DL><p>`;
};

export const generateNetscapeHTML = (roots: CollectionNode[]): string => {
  const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  const footer = `
</DL><p>
`;

  const body = roots.map(root => generateNetscapeFolder(root, 1)).join('');

  return header + body + footer;
};

export const generateJSON = (roots: CollectionNode[]): string => {
  const clean = (nodes: CollectionNode[]): any[] => {
    return nodes
      .filter(node => node.checked !== false)
      .map(node => ({
        _id: node._id,
        title: node.title,
        description: node.description,
        count: node.count,
        created: node.created,
        bookmarks: node.bookmarks
          .filter(b => b.checked !== false)
          .map(b => ({
            title: b.title,
            link: b.link,
            tags: b.tags,
            created: b.created,
            note: b.excerpt
          })),
        children: clean(node.children)
      }));
  };
  
  return JSON.stringify(clean(roots), null, 2);
};

export const generateCSV = (roots: CollectionNode[]): string => {
  const rows: string[] = [];
  // CSV Header
  rows.push('Title,URL,Folder Path,Tags,Created,Note');

  const processNode = (node: CollectionNode, path: string) => {
    if (node.checked === false) return;

    const currentPath = path ? `${path} > ${node.title}` : node.title;
    
    // Process bookmarks
    node.bookmarks.forEach(b => {
      if (b.checked === false) return;
      
      const created = b.created ? new Date(b.created).toISOString() : '';
      const tags = b.tags ? b.tags.join(';') : ''; // Semicolon separated
      
      rows.push([
        escapeCsv(b.title),
        escapeCsv(b.link),
        escapeCsv(currentPath),
        escapeCsv(tags),
        escapeCsv(created),
        escapeCsv(b.excerpt || '')
      ].join(','));
    });

    // Recurse
    node.children.forEach(child => processNode(child, currentPath));
  };

  roots.forEach(root => processNode(root, ''));
  return rows.join('\n');
};

export const generateXML = (roots: CollectionNode[]): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<raindrop_export>\n';

  const processNode = (node: CollectionNode, indent: number) => {
    if (node.checked === false) return '';
    
    const spaces = '  '.repeat(indent);
    let output = `${spaces}<collection title="${escapeHtml(node.title)}" id="${node._id}">\n`;
    
    // Bookmarks
    node.bookmarks.forEach(b => {
      if (b.checked === false) return;
      output += `${spaces}  <bookmark>\n`;
      output += `${spaces}    <title>${escapeHtml(b.title)}</title>\n`;
      output += `${spaces}    <url>${escapeHtml(b.link)}</url>\n`;
      if (b.excerpt) output += `${spaces}    <note>${escapeHtml(b.excerpt)}</note>\n`;
      if (b.tags && b.tags.length) output += `${spaces}    <tags>${escapeHtml(b.tags.join(','))}</tags>\n`;
      if (b.created) output += `${spaces}    <created>${b.created}</created>\n`;
      output += `${spaces}  </bookmark>\n`;
    });

    // Children
    node.children.forEach(child => {
      output += processNode(child, indent + 1);
    });

    output += `${spaces}</collection>\n`;
    return output;
  };

  roots.forEach(root => {
    xml += processNode(root, 1);
  });

  xml += '</raindrop_export>';
  return xml;
};

export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
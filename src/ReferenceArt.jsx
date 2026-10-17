import React from 'react';
import {topicArtwork} from './referenceArtwork.js';
export const referenceArt=Object.fromEntries(Object.entries(topicArtwork).map(([id,art])=>[id,{...art,file:id+'-v2.webp'}]));
export function artUrl(kind){return import.meta.env.BASE_URL+'illustrations/'+referenceArt[kind].file;}
export default function ReferenceArt({kind='measurement',opening=false}){const art=referenceArt[kind];return <figure className={'reference-art'+(opening?' reference-art-opening':'')}><img src={artUrl(kind)} alt={art.alt} width="1536" height="1024" decoding="async"/><figcaption>{art.caption}</figcaption></figure>;}

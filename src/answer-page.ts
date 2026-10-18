// Answer and topic pages: everything is prebuilt HTML; this only brings the shared styles, visit counts and
// the Share button.
import './analytics';
import './base.css';
import './answers.css';
import { bindShares } from './answers/share';

bindShares();

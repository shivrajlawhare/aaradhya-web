import { Box } from '@mui/material';
import aaradhyaMark from '../../assets/aaradhya-mark.svg';
import aaradhyaHeaderText from '../../assets/header-text.svg';
import {
  boxStyles,
  boxTitleStyles,
  brandLockupStyles,
  departmentColumnStyles,
  detailLabelStyles,
  detailsTableStyles,
  detailValueStyles,
  documentStyles,
  headerTextImageStyles,
  kitchenColumnStyles,
  lockupRowStyles,
  markImageStyles,
  menuHeadingStyles,
  notesGridStyles,
  notesSectionStyles,
  numberedListStyles,
  pageStyles,
  paxLinesStyles,
  sectionHeadingStyles,
  titleStyles,
} from './banquet-event-order-document.styles';
import {
  type BanquetEventOrderSession,
  type BeoKitchen,
  type BeoPage,
  buildBeoPage,
} from './banquet-event-order-lines';

interface NumberedListProps {
  items: string[];
}

const NumberedList = ({ items }: NumberedListProps) => (
  <Box component="ol" sx={numberedListStyles}>
    {items.map((item, index) => (
      <li key={`${index}-${item}`}>{item}</li>
    ))}
  </Box>
);

interface KitchenBoxProps {
  kitchen: BeoKitchen;
}

const KitchenBox = ({ kitchen }: KitchenBoxProps) => (
  <Box component="section" aria-label="Kitchen/Menu" sx={boxStyles}>
    <Box component="h3" sx={boxTitleStyles}>
      Kitchen/Menu
    </Box>
    {kitchen.paxLines.map((line) => (
      <Box component="p" key={line} sx={paxLinesStyles}>
        {line}
      </Box>
    ))}
    {kitchen.menus.map((menu, index) => (
      <Box key={`${index}-${menu.heading}`}>
        <Box component="p" sx={menuHeadingStyles}>
          {menu.heading}
        </Box>
        <NumberedList items={menu.items} />
      </Box>
    ))}
  </Box>
);

interface BeoPageViewProps {
  page: BeoPage;
}

const BeoPageView = ({ page }: BeoPageViewProps) => (
  <Box component="article" aria-label={`Banquet Event Order — ${page.functionType}`} sx={pageStyles}>
    <Box sx={lockupRowStyles}>
      <Box sx={brandLockupStyles}>
        <Box component="img" src={aaradhyaMark} alt="Aaradhya" sx={markImageStyles} />
        <Box
          component="img"
          src={aaradhyaHeaderText}
          alt="Aaradhya — A Complete Destination"
          sx={headerTextImageStyles}
        />
      </Box>
    </Box>
    <Box component="h2" sx={titleStyles}>
      Banquet Event Order
    </Box>
    <Box component="dl" sx={detailsTableStyles}>
      {page.details.map((row) => [
        <Box component="dt" key={`${row.label}-label`} sx={detailLabelStyles}>
          {row.label}
        </Box>,
        <Box component="dd" key={`${row.label}-value`} sx={detailValueStyles}>
          {row.value}
        </Box>,
      ])}
    </Box>
    <Box component="section" sx={notesSectionStyles}>
      <Box component="h3" sx={sectionHeadingStyles}>
        Notes To Departments
      </Box>
      <Box sx={notesGridStyles}>
        <Box sx={kitchenColumnStyles}>{page.kitchen && <KitchenBox kitchen={page.kitchen} />}</Box>
        <Box sx={departmentColumnStyles}>
          {page.departments.map((box) => (
            <Box component="section" key={box.title} aria-label={box.title} sx={boxStyles}>
              <Box component="h3" sx={boxTitleStyles}>
                {box.title}
              </Box>
              <NumberedList items={box.lines} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
);

interface BanquetEventOrderDocumentProps {
  clientName: string;
  sessions: BanquetEventOrderSession[];
}

// The Notes for Department document (CR-1 D5): one Banquet Event Order page
// per active session. One render tree for the preview and the server-side
// PDF (`?print=1`). It carries no prices — the payload has none.
const BanquetEventOrderDocument = ({ clientName, sessions }: BanquetEventOrderDocumentProps) => (
  <Box sx={documentStyles}>
    {sessions.map((session) => (
      <BeoPageView key={session.id} page={buildBeoPage(clientName, session)} />
    ))}
  </Box>
);

export default BanquetEventOrderDocument;

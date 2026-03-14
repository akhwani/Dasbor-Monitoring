export interface Regulation {
  id: number;
  kode_reg: string;
  judul: string;
  pengusul: string;
  tahun: number;
  status: string;
  dokumenUrl: string;
  tanggalPerubahan: string;
  keterangan: string | null;
  progress: number;
}

export interface HistoryItem {
  kode_reg: string;
  nama_regulasi: string;
  tanggal: string;
  keterangan: string;
  status: string;
}

import Papa from 'papaparse';

export const fetchGoogleSheetData = async (url: string, historyGid: string = '1585102885'): Promise<{ regulations: Regulation[], history: HistoryItem[] }> => {
  try {
    // Convert regular Google Sheet URL to CSV export URL
    const sheetId = url.match(/\/d\/([^/]+)/)?.[1];
    console.log('Fetching Sheet ID:', sheetId);
    if (!sheetId) throw new Error('Invalid Google Sheet URL');
    
    // Fetch main data (Sheet 1) with cache busting
    const dataUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0&t=${Date.now()}`;
    // Fetch history data (Sheet 2) with cache busting
    const historyUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${historyGid}&t=${Date.now()}`;
    
    console.log('Data URL:', dataUrl);
    console.log('History URL:', historyUrl);

    const [dataRes, historyRes] = await Promise.allSettled([
      fetch(dataUrl),
      fetch(historyUrl)
    ]);

    let dataCsvText = '';
    if (dataRes.status === 'fulfilled' && dataRes.value.ok) {
      dataCsvText = await dataRes.value.text();
      console.log('Main data fetched successfully, length:', dataCsvText.length);
    } else {
      const errorMsg = dataRes.status === 'rejected' ? dataRes.reason : `HTTP ${dataRes.value.status}`;
      console.error('Main data fetch failed:', errorMsg);
      throw new Error('Gagal mengambil data utama dari Google Sheets. Pastikan sheet dibagikan ke "Siapa saja yang memiliki link".');
    }

    let historyCsvText = '';
    if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
      historyCsvText = await historyRes.value.text();
      console.log('History data fetched successfully, length:', historyCsvText.length);
    } else {
      console.warn('History data fetch failed or not found. Using empty history.');
    }
    
    const parseData = (): Promise<Regulation[]> => new Promise((resolve, reject) => {
      Papa.parse(dataCsvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('Parsed main data rows:', results.data.length);
          if (results.data.length > 0) {
            console.log('First row of data:', results.data[0]);
          }
          if (results.errors.length > 0) {
            console.warn('Parsing errors:', results.errors);
          }
          const mappedData: Regulation[] = results.data.map((row: Record<string, string>, index: number) => {
            const rawProgress = (row['progress'] || row['Progress'] || '0').toString();
            const progress = parseInt(rawProgress.replace('%', '')) || 0;
            
            return {
              id: parseInt(row['no'] || row['No'] || row['id'] || row['ID']) || index + 1,
              kode_reg: (row['kode_reg'] || row['Kode_Reg'] || row['Kode Reg'] || row['KODE_REG'] || '').toString().trim(),
              judul: row['Nama Regulasi'] || row['judul'] || row['Judul'] || row['nama_regulasi'] || '',
              pengusul: row['Unit kerja'] || row['pengusul'] || row['Pengusul'] || row['unit_kerja'] || '',
              tahun: parseInt(row['Tahun'] || row['tahun']) || new Date().getFullYear(),
              status: (row['status'] || row['Status'] || '').toLowerCase(),
              dokumenUrl: row['link dokumen'] || row['link_dokumen'] || row['Link Dokumen'] || '#',
              tanggalPerubahan: row['data perubahan'] || row['Data Perubahan'] || row['tanggal perubahan'] || row['Tanggal Perubahan'] || '-', 
              keterangan: row['keterangan'] || row['Keterangan'] || row['KETERANGAN'] || row['ket'] || row['Ket'] || row['Catatan'] || row['catatan'] || row['Keterangan/Catatan'] || null,
              progress: progress,
            };
          });
          resolve(mappedData);
        },
        error: reject
      });
    });

    const parseHistory = (): Promise<HistoryItem[]> => new Promise((resolve, reject) => {
      if (!historyCsvText) {
        resolve([]);
        return;
      }
      Papa.parse(historyCsvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mappedHistory: HistoryItem[] = results.data
            .map((row: Record<string, string>) => ({
              kode_reg: (row['kode_reg'] || row['Kode_Reg'] || row['Kode Reg'] || row['KODE_REG'] || '').toString().trim(),
              nama_regulasi: (row['nama_regulasi'] || row['Nama Regulasi'] || row['nama regulasi'] || '').toString().trim(),
              tanggal: (row['tanggal perubahan'] || row['tanggal rapat'] || row['tanggal'] || row['Tanggal'] || row['Tanggal Perubahan'] || '').toString().trim(),
              keterangan: (row['keterangan'] || row['Keterangan'] || '').toString().trim(),
              status: (row['status'] || row['Status'] || '').toString().trim(),
            }))
            .filter((item: HistoryItem) => item.kode_reg && item.tanggal);
          resolve(mappedHistory);
        },
        error: reject
      });
    });

    const [regulations, history] = await Promise.all([parseData(), parseHistory()]);
    return { regulations, history };

  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    throw error;
  }
};

export const MOCK_REGULATIONS: Regulation[] = [];

export const MOCK_HISTORY: HistoryItem[] = [];

import React, { useState } from 'react';
import { Candidate, COURSES_DATA } from '../data/imfaData';
import { CandidateAvatar } from './CandidateAvatar';
import { processImageFileToDataUrl } from '../utils/fileReader';

interface ManualRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newCandidateData: {
    fullName: string;
    biNumber: string;
    birthDate: string;
    gender: 'Masculino' | 'Feminino';
    phonePrimary: string;
    email: string;
    municipality: Candidate['municipality'];
    previousSchool: string;
    courseId: Candidate['courseId'];
    matematica: number;
    portugues: number;
    fisica: number;
    quimica: number;
    photoUrl?: string;
    photoFileName?: string;
    photoFileSize?: string;
  }) => void;
}

export const ManualRegistrationModal: React.FC<ManualRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState('');
  const [biNumber, setBiNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino'>('Masculino');
  const [phonePrimary, setPhonePrimary] = useState('');
  const [email, setEmail] = useState('');
  const [municipality, setMunicipality] = useState<Candidate['municipality']>('luanda');
  const [previousSchool, setPreviousSchool] = useState('');
  const [courseId, setCourseId] = useState<Candidate['courseId']>('ig');
  const [matematica, setMatematica] = useState(14);
  const [portugues, setPortugues] = useState(14);
  const [fisica, setFisica] = useState(14);
  const [quimica, setQuimica] = useState(14);
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoFileSize, setPhotoFileSize] = useState('420 KB');

  if (!isOpen) return null;

  const handlePhotoUpload = async (file?: File | null) => {
    if (!file) return;
    setPhotoFileName(file.name);
    try {
      const processed = await processImageFileToDataUrl(file, 480, 600, 0.88);
      setPhotoDataUrl(processed.dataUrl);
      setPhotoFileSize(processed.sizeFormatted);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    onSubmit({
      fullName: fullName.trim(),
      biNumber,
      birthDate,
      gender,
      phonePrimary,
      email,
      municipality,
      previousSchool,
      courseId,
      matematica: Number(matematica),
      portugues: Number(portugues),
      fisica: Number(fisica),
      quimica: Number(quimica),
      photoUrl: photoDataUrl,
      photoFileName: photoFileName || undefined,
      photoFileSize,
    });
    setFullName('');
    setPhotoDataUrl('');
    setPhotoFileName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-space-md overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-surface-variant my-8">
        <div className="p-space-lg bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Registar Candidatura Manual — 10.ª Classe
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                Secretaria Presencial ITPGQ • Ano Letivo 2026–2027
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container-high text-secondary hover:text-on-surface cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-space-lg space-y-space-md">
          <div className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm">
              <CandidateAvatar
                src={photoDataUrl}
                alt={fullName || 'Candidato'}
                initials={
                  fullName.trim()
                    ? fullName
                        .trim()
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                    : 'FT'
                }
                variant="passport"
                className="w-14 h-16 rounded-lg shrink-0"
              />
              <div>
                <span className="font-label-sm text-label-sm text-on-surface font-bold block">
                  Fotografia Tipo Passe do Candidato (3x4)
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  {photoFileName
                    ? `${photoFileName} (${photoFileSize})`
                    : 'Anexe a fotografia do estudante para gravar no Supabase'}
                </span>
              </div>
            </div>
            <label className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-sm text-xs font-bold cursor-pointer hover:bg-primary-container flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
              <span>{photoDataUrl ? 'Alterar Foto' : 'Carregar Foto'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="sm:col-span-2">
              <label className="font-label-sm text-label-sm text-secondary uppercase font-bold block mb-1">
                Nome Completo do Candidato *
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Sebastião Mateus Agostinho"
                className="w-full h-11 px-space-md rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                type="text"
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-bold block mb-1">
                N.º do Bilhete de Identidade (BI)
              </label>
              <input
                required
                value={biNumber}
                onChange={(e) => setBiNumber(e.target.value)}
                className="w-full h-11 px-space-md rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-mono text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                type="text"
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-bold block mb-1">
                Telefone Angolano (+244)
              </label>
              <input
                required
                value={phonePrimary}
                onChange={(e) => setPhonePrimary(e.target.value)}
                className="w-full h-11 px-space-md rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                type="text"
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-bold block mb-1">
                Curso Técnico Pretendido
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value as Candidate['courseId'])}
                className="w-full h-11 px-space-md rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {COURSES_DATA.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.classCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-bold block mb-1">
                Município de Residência
              </label>
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value as Candidate['municipality'])}
                className="w-full h-11 px-space-md rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="luanda">Luanda — Ingombota / Maianga</option>
                <option value="belas">Belas / Benfica / Kilamba</option>
                <option value="talatona">Talatona</option>
                <option value="viana">Viana</option>
                <option value="cazenga">Cazenga</option>
                <option value="cacuaco">Cacuaco</option>
                <option value="outras">Outras Províncias</option>
              </select>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-bold block mb-1">
                Data de Nascimento
              </label>
              <input
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-11 px-space-md rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body-md"
                type="text"
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-bold block mb-1">
                Género
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Masculino' | 'Feminino')}
                className="w-full h-11 px-space-md rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body-md"
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-label-sm text-label-sm text-secondary uppercase font-bold block mb-1">
                Escola de Proveniência (9.ª Classe)
              </label>
              <input
                value={previousSchool}
                onChange={(e) => setPreviousSchool(e.target.value)}
                className="w-full h-11 px-space-md rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-body-md"
                type="text"
              />
            </div>
          </div>

          <div className="p-space-md bg-surface-container-low rounded-xl space-y-space-xs">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold block">
              Notas de Acesso da 9.ª Classe (0 a 20 Valores)
            </span>
            <div className="grid grid-cols-4 gap-space-sm">
              <div>
                <label className="text-body-sm text-secondary block">Matemática</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={matematica}
                  onChange={(e) => setMatematica(Number(e.target.value))}
                  className="w-full h-10 px-2 rounded bg-surface-container-lowest font-headline-sm text-primary font-bold text-center"
                />
              </div>
              <div>
                <label className="text-body-sm text-secondary block">Português</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={portugues}
                  onChange={(e) => setPortugues(Number(e.target.value))}
                  className="w-full h-10 px-2 rounded bg-surface-container-lowest font-headline-sm text-primary font-bold text-center"
                />
              </div>
              <div>
                <label className="text-body-sm text-secondary block">Física</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={fisica}
                  onChange={(e) => setFisica(Number(e.target.value))}
                  className="w-full h-10 px-2 rounded bg-surface-container-lowest font-headline-sm text-secondary font-bold text-center"
                />
              </div>
              <div>
                <label className="text-body-sm text-secondary block">Química</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={quimica}
                  onChange={(e) => setQuimica(Number(e.target.value))}
                  className="w-full h-10 px-2 rounded bg-surface-container-lowest font-headline-sm text-secondary font-bold text-center"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-space-sm pt-space-sm">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-space-lg rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label-md text-label-md cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-11 px-space-lg rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-md cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Homologar &amp; Registar Candidatura</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SmsNotificationModalProps {
  candidates: Candidate[];
  onClose: () => void;
  onSend: (channel: 'SMS' | 'WhatsApp', message: string) => void;
}

export const SmsNotificationModal: React.FC<SmsNotificationModalProps> = ({
  candidates,
  onClose,
  onSend,
}) => {
  const [channel, setChannel] = useState<'SMS' | 'WhatsApp'>('WhatsApp');
  const [message, setMessage] = useState(
    candidates.length === 1
      ? `Caro(a) Encarregado(a) de ${candidates[0].fullName}, informamos que o processo de admissão #${candidates[0].id} (10.ª Classe IMFA 2026–2027) foi atualizado pela Comissão Pedagógica.`
      : `Caro(a) Encarregado(a), informamos que a candidatura à 10.ª Classe no IMFA (Ano Letivo 2026–2027) encontra-se em fase de atualização cadastral. Consulte o portal oficial.`
  );

  if (candidates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-space-md">
      <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-surface-variant">
        <div className="p-space-md bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary">chat</span>
            <div>
              <h3 className="font-headline-sm text-label-lg font-bold text-on-surface">
                Notificação Oficial SMS / WhatsApp (+244)
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                {candidates.length} destinatário(s) selecionado(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-container-high text-secondary cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-space-lg space-y-space-md">
          <div className="flex gap-space-sm">
            <button
              type="button"
              onClick={() => setChannel('WhatsApp')}
              className={`flex-1 py-2 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1 cursor-pointer ${
                channel === 'WhatsApp'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              WhatsApp Institucional
            </button>
            <button
              type="button"
              onClick={() => setChannel('SMS')}
              className={`flex-1 py-2 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1 cursor-pointer ${
                channel === 'SMS'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">sms</span>
              Gateway SMS Unitel/Movicel
            </button>
          </div>

          <div className="bg-surface-container-low p-space-sm rounded-lg max-h-28 overflow-y-auto space-y-1">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between text-body-sm font-body-sm"
              >
                <span className="font-semibold text-on-surface truncate">{c.fullName}</span>
                <span className="font-mono text-secondary tabular-nums">{c.phonePrimary}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="font-label-sm text-label-sm text-secondary uppercase font-bold block mb-1">
              Mensagem Institucional
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-space-sm rounded-lg bg-surface-container text-on-surface font-body-md focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-space-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-space-md py-space-xs rounded-lg bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSend(channel, message)}
              className="px-space-lg py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>Disparar {channel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

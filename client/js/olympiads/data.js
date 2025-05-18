console.log('Начало загрузки data.js');
const stages = ['school', 'municipal', 'regional', 'final'];
let olympiadData = {
    school: { subjects: [], participations: {}, students: [] },
    municipal: { subjects: [], participations: {}, students: [] },
    regional: { subjects: [], participations: {}, students: [] },
    final: { subjects: [], participations: {}, students: [] }
};
console.log('Файл data.js полностью загружен');
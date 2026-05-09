import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from './ResumeContext';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111',
  },

  // Header
  header: { marginBottom: 15, textAlign: 'center' },
  name: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  jobProfile: {
    fontSize: 11,
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  contact: { fontSize: 9, color: '#444', marginBottom: 2 },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },

  // Item blocks (experience, projects, education)
  itemContainer: { marginBottom: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  date: { fontSize: 9, color: '#444' },
  subtitle: { fontFamily: 'Helvetica-Oblique', fontSize: 10, marginBottom: 3 },
  body: { fontSize: 9, lineHeight: 1.4, textAlign: 'justify' },

  // Skills grid
  skillRow: { flexDirection: 'row', marginBottom: 3 },
  skillLabel: { fontFamily: 'Helvetica-Bold', width: 100 },
  skillValue: { flex: 1 },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Turns "React,Node,Java" → "React | Node | Java" */
const formatTags = (tags: string) => (tags ? tags.split(',').join(' | ') : '');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ResumePDF = ({ data }: { data: ResumeData }) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* ------------------------------------------------------------------ */}
      {/* Header & Personal Info                                              */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.personalInfo.fullName || 'NAME'}</Text>

        {data.personalInfo.website && (
          <Text style={styles.jobProfile}>
            {formatTags(data.personalInfo.website)}
          </Text>
        )}

        <Text style={styles.contact}>
          {data.personalInfo.email}  |  {data.personalInfo.phone}  |  {data.personalInfo.location}
        </Text>

        <Text style={styles.contact}>
          {data.personalInfo.linkedin && `LinkedIn: ${data.personalInfo.linkedin}`}
          {data.personalInfo.github   && `  |  GitHub: ${data.personalInfo.github}`}
        </Text>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Professional Summary                                                */}
      {/* ------------------------------------------------------------------ */}
      {data.personalInfo.summary && (
        <View>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.body}>{data.personalInfo.summary}</Text>
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Experience                                                          */}
      {/* ------------------------------------------------------------------ */}
      {data.experience.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.experience.map((exp) => (
            <View key={exp.id} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.title}>{exp.title} at {exp.company}</Text>
                <Text style={styles.date}>{exp.duration}</Text>
              </View>
              <Text style={styles.body}>{exp.responsibilities}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Projects                                                            */}
      {/* ------------------------------------------------------------------ */}
      {data.projects.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Projects</Text>
          {data.projects.map((proj) => (
            <View key={proj.id} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.title}>
                  {proj.name} | <Text style={styles.subtitle}>{proj.stack}</Text>
                </Text>
              </View>
              <Text style={styles.body}>{proj.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Education                                                           */}
      {/* ------------------------------------------------------------------ */}
      {data.education.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.education.map((edu) => (
            <View key={edu.id} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.title}>{edu.institution}</Text>
                <Text style={styles.date}>{edu.duration}</Text>
              </View>
              <Text style={styles.subtitle}>
                {edu.degree}{edu.grade ? ` | ${edu.grade}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Skills & Languages                                                  */}
      {/* ------------------------------------------------------------------ */}
      <View>
        <Text style={styles.sectionTitle}>Skills &amp; Languages</Text>

        {data.skills.technical && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Technical:</Text>
            <Text style={styles.skillValue}>{formatTags(data.skills.technical)}</Text>
          </View>
        )}

        {data.skills.tools && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Tools:</Text>
            <Text style={styles.skillValue}>{formatTags(data.skills.tools)}</Text>
          </View>
        )}

        {data.skills.soft && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Soft Skills:</Text>
            <Text style={styles.skillValue}>{formatTags(data.skills.soft)}</Text>
          </View>
        )}

        {data.skills.languages && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Languages:</Text>
            <Text style={styles.skillValue}>{formatTags(data.skills.languages)}</Text>
          </View>
        )}
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Certifications, Awards & Hobbies                                   */}
      {/* ------------------------------------------------------------------ */}
      {(data.extras.certifications || data.extras.awards || data.extras.hobbies) && (
        <View>
          <Text style={styles.sectionTitle}>Certifications, Awards &amp; Hobbies</Text>

          {data.extras.certifications && (
            <View style={styles.skillRow}>
              <Text style={styles.skillLabel}>Certifications:</Text>
              <Text style={styles.skillValue}>{data.extras.certifications}</Text>
            </View>
          )}

          {data.extras.awards && (
            <View style={styles.skillRow}>
              <Text style={styles.skillLabel}>Awards:</Text>
              <Text style={styles.skillValue}>{data.extras.awards}</Text>
            </View>
          )}

          {data.extras.hobbies && (
            <View style={styles.skillRow}>
              <Text style={styles.skillLabel}>Hobbies:</Text>
              <Text style={styles.skillValue}>{data.extras.hobbies}</Text>
            </View>
          )}
        </View>
      )}

    </Page>
  </Document>
);